# State Analysis Ideas

## Concepts

| Term | Info |
| :--: | :--: |
| Theatre | A selection of bodies surrounding systems of interest |
| Systems of Interest | An array of star systems of concern to watch |
| Influence | The level of influence a minor faction has per star system |
| Conflict | A state caused when influences cross in a star system, causes asset handover |
| State | A factions present state in a system |
| Expansion | A faction above 75% will move to the nearest system with less than 7 minor factions present, within a 20LY bounding box of the origin system (with exceptions) |
| Prime Minor Faction | The faction we're most interested in (usually the player faction at the centre of operations ) |
| Risk | The potential for the operational theatre to change within any system in the Theatre |



## Star Systems & Faction Influence

- In "Interested" systems:
  - Inform when a non-native minor faction is at risk of retreat (sub 5% INF)
    - Especially interesting if the system will drop below 7 Factions Present

- Inform when a minor faction is poised for Expansion (above 70% INF)
  - Locate potential expansion systems

- Inform when a minor faction is pending/active Expansion
  - A rare state, identifies when their next expansion reach will be +10LY range

- Inform when a minor faction is within 5% of another minor faction in system
  - May incite a conflict

## Assets

- Identify all assets that may be involved in conflict - potential handovers

## Data Refresh Age

- Identify oldest system data for theatre requiring updates

## Creating a dashboard

- A theatre map (top down + isometric)
  - Populated Systems = dots in grey
  - Prime Faction Presence = Circled in White
  - Prime Faction in Conflict = Circled in Red
  - Systems of Interest In Theatre = Labelled and Bright White
  - Systems with less than 7 factions = dots in dark green
  - Conflicts in Systems of Interest (not Prime) = Brightly Colored in Red
  - Conflicts in Theatre (but not in SOI) = darkly colored in Red
  - Prime Faction Expansion Targets = low opacity blue line from source to destination
- System Reports
  - Everywhere the Prime Minor Faction Exists // _IMPORTANT_
    - System Minor Faction Current Influence Report
      - Table: Faction + Inf% /w Delta + Present States
      - and (maybe graph) - Delta Last Tick, Delta 7 days
    - Risks
      - Possible/Pending/Active NNF Retreats
      - Possible/Pending/Active Conflicts    
    - Active Conflict Status
      - Wins/Losses
    - Assets & Ownership (Can be a long list, stub this?  7/8 wide table?)
  - Systems of Interest // _Watch List_
    - Risks
    - Active Conflicts Status
      - Wins/Losses
    - Assets
  - Theatre // _Informational_
    - Risks
      - Possible/Pending/Active NNF Retreats
      - Possible/Pending/Active Conflicts
    - Oldest Data
    - Possible Expansion Targets
  - Changes Log Detected Over Last 7 Ticks
    - Date:System:DotNotatedKey:PrevVal -> Key:NextVal

### Compactifying Data

Rules:

- Avoid whitespace
- Monospace Numerics
- Shorten Faction Names to Initials
- Tiny Headers or Vertical Right Side Titles