# EDDN Ingest System

## Goal

Subscribe to and process the raw feed of the Elite Dangerous Data Network to perform some cool stuff like realtime BGS monitoring.

## Functions Required

- EDDN schema parsing support
- Case/Switching Message Types
- Pub/Sub Message Queueing Store for processing
- Message Clearing/Expiry
- Object Status/Value Change Detection Streaming
- Subscription to KV changes
- Push-Oriented Gigantic Time-Series Value Monitoring (eg. OpenTSDB/InfluxDB, not scrapey Prometheus)
- Separate Processing of Dumps vs EDDB Streams

## Big Data Stores

- Systems
- Factions
- Bodies (YUUUGE)
- Market (Biggum)
- Attractions/Settlements/etc

There are 5 years of dumps that can be ingested to create a 'state of the discovered universe' as known by players.  

As of this writing (04-Sep-2022), the archive data totals from edgalaxydata.space total:

| Source | Kind | Size |
| :----- | :--: | ---: |
| EDDN | Stream | 146GB |
| EDSM Bodies | Stream | 227GB |
| EDSM Systems | Stream | 2GB |

edgalaxydata.space also provides Indexer disk usage that would provide an idea of ongoing de-deduplicated data storage once streams are all ingested:

| Indexed Data | Total Size (Index+Data) |
| ------------ | ----------------------: |
| Systems      |  5.7GB   |
| Bodies       | 21.7GB   |
| Stations     | 54.6MB   |

Expect ~10x reduction in stream data to indexed data.

## Stream Processing

### From EDDN

EDDN Stream Processing will place inbound messages into an initial ingestion queue where:

- One or more subscriber processes will read each message and,
- Split the messages by $schema and,
- Push the message into an EDDN-queue specific to that $schema for further processing.

As messages are routed out to their schema-specific queues:

- One or more schema-specific subscriber processes will read each message and,
- perform configured actions for each type - an action is one or more of (not exclusively):
  - Drop Message (eg. we don't care about FSD Jumps)
  - Record Numeric Values to TSDB - For Trending & Alerting on Changes
  - Check for Changes against Index - For alerting when object properties change
  - Update Index - For saving state of observed object (eg. system updates)
- The actions will EXCLUSIVELY simply place results on a final queue related to each required action for final processing

As final action queues are filled:

- One or more action-specific subscriber processes will read each message and,
- Perform their associated final action for each message (saving to index, checking for changes, etc)

### From Dumps

EDDN Stream Capture Dumps will read and streamed in from a download process and,

- will save messages into a dump queue
- The dump queue will have subscribers specifically associated to handling historical data to avoid EDDN intake congestion
- Dump data will usually not alert but will serve to simply update indexed data, if and only if the historical data has never been captured before, or the data has an older timestamp than the one existing in the indexer
- The historical data may also pass through the TSDB forwarder to capture and backfill historical values of interest.


## Tech

Some choices to be made for DataStores:

- Systems, Bodies data:
  - Elastic
    - Pro: Scalable by function (ingest heads, data heads, search heads), simple search model, JSON-object blob-centric, Bulk load is JSONL, object versioning.
    - Con: Disk usage, slow, index dramatics.
    - Works well for: Loading large complex data sets at a single point in time, streaming in always-new data (write-many, read-few), when you need to **search**.
  - etcd
    - Pro: Immediate Consistency, scales out to very large data sets, Change Watches supported.
    - Con: No paritioning/sharding support, search-by-key not by value.
    - Works well for: Highly structured data that sees change in state/values over time stream in.
  - Redis
    - Pro: Top KV store, most lang support, very fast, pub-sub channels/watching supported, sharding supported, plugins for TSDB and JSONStore
    - Cons: In-Mem limits amount of workable data, durability is by snapshot, proprietary wire protocol - support must be built into language.
    - Works well for: When you need a one-size-fits-all kv store

- Queuing
  - Kafka
    - Pro: Ideal if holding onto stream data to avoid re-pushing - topics can be replayed by consumers
    - Con: Disk usage higher, stubbing is complex, topic paritioning tied to worker count, repartitioning painful.
    - Works well for: Dump queueing
  - Rabbit
    - Pro: Ideal for simple routing of inbound streams at a very high rate
    - Con: Messages are consumed and cleared once read, lossy if something reads and fails to do its job, need a separate durable persistence store that is just as performant for guarantees.
    - Works well for: Fast stream processing if processes handle action logic post routing.
  - ZeroMQ
    - Pro: Low level, compact, fast, in-memory, multi-model queues.
    - Con: High Water Mark for a 0mq process can result in OOM conditions and lossiness.  Non-guaranteeable.  Client-centric.

Questions we can ask about scaling these tools:

### Durable Store Selection

> What does it look like when 100% of the galaxy is mapped, seeing as we're at >0.1% - what tools can scale to this?

- Redis will fall flat on its face without a backing store
- Elasticsearch will scale as long as you have durable backing storage and instances to meet the query speed required.
- etcd can be configured for up-to 8GB backend storage limit, we're already beyond this now.

:star: **Elastic** : As we are working with very large data sets, and we aren't super concerned about ultra-high-speed realtime delivery (things can wait a tad), Elastic is the only choice that is durable and scales out.

### Message Queue Handling Selection

> What if 10x....100x players start sending data into EDDN?  What if EDDN starts tracking more info?

Right now we see ~15msg/sec into the eddn relay, averaged over a 60 minute timeframe.  The bottleneck on the eddn relay is likely bandwidth and/or CPU first.

- 10x: 150msg/sec - Inbound traffic on eddn would spike to 10Mbit/sec, outbound to subscriber traffic would hit ~100Mbit/sec, CPU would hit ~20%.
- 100x: 1500msg/sec - Inbound traffic on eddn would spike to 100Mbit/sec, outbound to subscriber traffic would hit ~1Gbit/sec, CPU would be saturated and observed values of the previous two would likely be halved with client latency going up.

The peak data rate, even if suddenly the game became ultra popular or the EDDN client apps added a very noisy schema, a subscription shouldn't really expect to see more than 700 messages per second.

- Kafka: 100,000 msgs/sec no problem
- Rabbit: 20,000 msgs/sec no problem
- ZeroMQ: Very much tied to message size - Most EDDN messages are sub-2kb.  ZeroMQ does not slow down to sub-10000 messages/sec until message sizes reach 10KB.

:star: **RabbitMQ** : As we're not so concerned with lossiness (as we can recap using dumps captured by others), and there is no actual strong requirement to hold onto stream data (we want to process and be done), the ideal library for the job is RabbitMQ.

### Time Series Selection

> Could Elastic serve as the metrics store, or does a better solution exist?

TBD.
