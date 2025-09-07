# Data Flow Diagram - Core Systems Refactor

## System Architecture Overview

```mermaid
graph TB
    subgraph "Presentation Layer"
        MapUI[Map UI]
        SidebarUI[Sidebar UI]
        MobileUI[Mobile UI]
        DesktopUI[Desktop UI]
    end
    
    subgraph "Application Layer"
        MapMgr[Map Manager]
        SidebarMgr[Sidebar Manager]
        SearchMgr[Search Manager]
        StateMgr[State Manager]
    end
    
    subgraph "Service Layer"
        DataSvc[Data Service]
        EventBus[Event Bus]
        ConfigSvc[Config Service]
        PlatformSvc[Platform Service]
    end
    
    subgraph "Infrastructure Layer"
        Storage[Storage]
        Network[Network]
        Cache[Cache]
        Monitoring[Monitoring]
    end
    
    MapUI --> MapMgr
    SidebarUI --> SidebarMgr
    MobileUI --> MapMgr
    DesktopUI --> SidebarMgr
    
    MapMgr --> EventBus
    SidebarMgr --> EventBus
    SearchMgr --> EventBus
    StateMgr --> EventBus
    
    EventBus --> DataSvc
    EventBus --> ConfigSvc
    EventBus --> PlatformSvc
    
    DataSvc --> Storage
    DataSvc --> Network
    DataSvc --> Cache
    ConfigSvc --> Storage
    PlatformSvc --> Network
    
    Storage --> Monitoring
    Network --> Monitoring
    Cache --> Monitoring
```

## Data Flow Patterns

### 1. Initialization Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant Platform as Platform Service
    participant Config as Config Service
    participant EventBus as Event Bus
    participant State as State Manager
    participant Data as Data Service
    participant Map as Map Manager
    participant Sidebar as Sidebar Manager
    
    App->>Platform: Detect Platform
    Platform-->>App: Platform Capabilities
    
    App->>Config: Load Configuration
    Config-->>App: Environment Config
    
    App->>EventBus: Initialize Event Bus
    EventBus-->>App: Event Bus Ready
    
    App->>State: Initialize State Manager
    State-->>App: State Manager Ready
    
    App->>Data: Initialize Data Service
    Data-->>App: Data Service Ready
    
    App->>Map: Initialize Map Manager
    Map-->>App: Map Manager Ready
    
    App->>Sidebar: Initialize Sidebar Manager
    Sidebar-->>App: Sidebar Manager Ready
    
    App->>Data: Load Critical Data
    Data-->>EventBus: Data Loaded Event
    EventBus->>Map: Update Map
    EventBus->>Sidebar: Update Sidebar
```

### 2. User Interaction Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Sidebar as Sidebar Manager
    participant EventBus as Event Bus
    participant State as State Manager
    participant Map as Map Manager
    participant Data as Data Service
    
    User->>Sidebar: Click Item
    Sidebar->>EventBus: Item Selected Event
    EventBus->>State: Update State
    State-->>EventBus: State Updated Event
    EventBus->>Map: Add Layer
    EventBus->>Sidebar: Update UI
    
    Map->>Data: Request Data (if needed)
    Data-->>Map: Return Data
    Map->>EventBus: Layer Added Event
    EventBus->>Sidebar: Update Selection State
```

### 3. Error Handling Flow

```mermaid
sequenceDiagram
    participant Component as Component
    participant ErrorBoundary as Error Boundary
    participant CircuitBreaker as Circuit Breaker
    participant EventBus as Event Bus
    participant User as User
    
    Component->>CircuitBreaker: Execute Operation
    CircuitBreaker->>Component: Operation Fails
    
    Component->>ErrorBoundary: Catch Error
    ErrorBoundary->>ErrorBoundary: Classify Error
    
    alt Retry Strategy
        ErrorBoundary->>CircuitBreaker: Retry with Backoff
        CircuitBreaker->>Component: Retry Operation
    else Fallback Strategy
        ErrorBoundary->>Component: Use Fallback
        Component-->>ErrorBoundary: Fallback Success
    else Circuit Breaker Open
        ErrorBoundary->>EventBus: Block Future Requests
        EventBus->>User: Show Error Message
    end
```

### 4. Data Loading Flow

```mermaid
sequenceDiagram
    participant Component as Component
    participant DataService as Data Service
    participant Cache as Cache
    participant Network as Network
    participant Validator as Data Validator
    participant EventBus as Event Bus
    
    Component->>DataService: Request Data
    DataService->>Cache: Check Cache
    
    alt Cache Hit
        Cache-->>DataService: Return Cached Data
        DataService-->>Component: Return Data
    else Cache Miss
        DataService->>Network: Fetch from Source
        Network-->>DataService: Return Raw Data
        DataService->>Validator: Validate Data
        
        alt Valid Data
            Validator-->>DataService: Validation Success
            DataService->>Cache: Store in Cache
            DataService-->>Component: Return Data
            DataService->>EventBus: Data Loaded Event
        else Invalid Data
            Validator-->>DataService: Validation Failed
            DataService-->>Component: Throw Error
        end
    end
```

## State Management Flow

### 1. State Update Flow

```mermaid
graph LR
    Action[User Action] --> Event[Event Emission]
    Event --> EventBus[Event Bus]
    EventBus --> Handler[Component Handler]
    Handler --> StateUpdate[State Update]
    StateUpdate --> StateChange[State Change Event]
    StateChange --> Subscribers[UI Components]
    Subscribers --> UIUpdate[UI Update]
    
    style Action fill:#e8f5e8
    style UIUpdate fill:#fff3e0
```

### 2. State Subscription Flow

```mermaid
graph TD
    Component[Component] --> Subscribe[Subscribe to State Path]
    Subscribe --> StateMgr[State Manager]
    StateMgr --> Store[Store Subscription]
    
    StateUpdate[State Update] --> StateMgr
    StateMgr --> Notify[Notify Subscribers]
    Notify --> Component
    Component --> Update[Update UI]
    
    style Component fill:#e3f2fd
    style Update fill:#f1f8e9
```

## Event System Flow

### 1. Event Processing Flow

```mermaid
graph TD
    Event[Event] --> Middleware[Middleware Pipeline]
    Middleware --> Logging[Logging Middleware]
    Logging --> ErrorHandling[Error Handling Middleware]
    ErrorHandling --> Performance[Performance Middleware]
    Performance --> Handlers[Event Handlers]
    Handlers --> Success[Success]
    Handlers --> Error[Error]
    Error --> ErrorRecovery[Error Recovery]
    
    style Event fill:#e8f5e8
    style Success fill:#e8f5e8
    style Error fill:#ffebee
```

### 2. Event Middleware Flow

```mermaid
sequenceDiagram
    participant Emitter as Event Emitter
    participant Logging as Logging Middleware
    participant ErrorHandling as Error Handling Middleware
    participant Performance as Performance Middleware
    participant Handler as Event Handler
    
    Emitter->>Logging: Emit Event
    Logging->>Logging: Log Event
    Logging->>ErrorHandling: Process Event
    
    ErrorHandling->>ErrorHandling: Validate Event
    ErrorHandling->>Performance: Process Event
    
    Performance->>Performance: Start Timer
    Performance->>Handler: Execute Handler
    
    Handler-->>Performance: Handler Result
    Performance->>Performance: End Timer
    Performance-->>ErrorHandling: Processed Event
    
    ErrorHandling-->>Logging: Processed Event
    Logging-->>Emitter: Event Processed
```

## Component Communication Flow

### 1. Map-Sidebar Communication

```mermaid
sequenceDiagram
    participant User as User
    participant Sidebar as Sidebar Manager
    participant EventBus as Event Bus
    participant Map as Map Manager
    participant State as State Manager
    
    User->>Sidebar: Select Layer
    Sidebar->>EventBus: Layer Selected Event
    EventBus->>Map: Add Layer to Map
    EventBus->>State: Update State
    
    Map->>EventBus: Layer Added Event
    EventBus->>Sidebar: Update Selection UI
    EventBus->>State: Update Map State
    
    State->>EventBus: State Updated Event
    EventBus->>Sidebar: Sync with State
    EventBus->>Map: Sync with State
```

### 2. Search-Data Communication

```mermaid
sequenceDiagram
    participant User as User
    participant Search as Search Manager
    participant EventBus as Event Bus
    participant Data as Data Service
    participant Sidebar as Sidebar Manager
    
    User->>Search: Enter Search Query
    Search->>Search: Build Search Index
    Search->>EventBus: Search Results Event
    
    EventBus->>Sidebar: Update Search Results
    EventBus->>Data: Request Data (if needed)
    
    Data->>EventBus: Data Loaded Event
    EventBus->>Search: Update Search Index
    EventBus->>Sidebar: Update Results
```

## Performance Optimization Flow

### 1. Data Virtualization Flow

```mermaid
graph TD
    Request[Data Request] --> Viewport[Check Viewport]
    Viewport --> Visible[Calculate Visible Data]
    Visible --> Load[Load Visible Data Only]
    Load --> Render[Render Visible Items]
    Render --> Scroll[User Scrolls]
    Scroll --> Viewport
    
    style Request fill:#e3f2fd
    style Render fill:#f1f8e9
```

### 2. Lazy Loading Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Component as Component
    participant LazyLoader as Lazy Loader
    participant Module as Module
    
    User->>Component: Trigger Action
    Component->>LazyLoader: Request Module
    LazyLoader->>LazyLoader: Check if Loaded
    
    alt Module Not Loaded
        LazyLoader->>Module: Import Module
        Module-->>LazyLoader: Module Loaded
        LazyLoader->>LazyLoader: Cache Module
    end
    
    LazyLoader-->>Component: Return Module
    Component->>Module: Execute Function
    Module-->>Component: Return Result
```

## Error Recovery Flow

### 1. Circuit Breaker Flow

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Open : Failure Threshold Reached
    Open --> HalfOpen : Reset Timeout
    HalfOpen --> Closed : Success
    HalfOpen --> Open : Failure
    
    state Closed {
        [*] --> Execute
        Execute --> Success : Operation Success
        Execute --> Failure : Operation Failure
        Success --> [*]
        Failure --> [*]
    }
    
    state Open {
        [*] --> Block
        Block --> [*]
    }
    
    state HalfOpen {
        [*] --> Test
        Test --> Success : Operation Success
        Test --> Failure : Operation Failure
        Success --> [*]
        Failure --> [*]
    }
```

### 2. Retry Strategy Flow

```mermaid
sequenceDiagram
    participant Component as Component
    participant RetryStrategy as Retry Strategy
    participant Operation as Operation
    
    Component->>RetryStrategy: Execute with Retry
    RetryStrategy->>Operation: Execute Operation
    
    alt Operation Success
        Operation-->>RetryStrategy: Success
        RetryStrategy-->>Component: Return Result
    else Operation Failure
        Operation-->>RetryStrategy: Failure
        RetryStrategy->>RetryStrategy: Calculate Delay
        RetryStrategy->>RetryStrategy: Wait for Delay
        RetryStrategy->>Operation: Retry Operation
        
        alt Max Retries Reached
            RetryStrategy-->>Component: Throw Error
        else Retry Success
            Operation-->>RetryStrategy: Success
            RetryStrategy-->>Component: Return Result
        end
    end
```

## Summary

These data flow diagrams illustrate:

1. **System Architecture**: Clear separation of concerns across layers
2. **Data Flow Patterns**: How data moves through the system
3. **Event Processing**: Event-driven communication patterns
4. **State Management**: Immutable state updates and subscriptions
5. **Component Communication**: Loose coupling via events
6. **Performance Optimization**: Virtualization and lazy loading
7. **Error Recovery**: Circuit breakers and retry strategies

The diagrams provide a visual representation of the refactored architecture, showing how the new system addresses the current fragility issues while providing a foundation for future growth and maintainability.
