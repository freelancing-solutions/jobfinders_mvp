# UI Component Specifications: Applications Management System

## Overview

This document defines the comprehensive UI component specifications for the Applications Management System. The components are designed to provide a modern, responsive, and accessible user experience with real-time updates, intelligent insights, and AI-powered features.

## Design System Integration

### Component Architecture
```
src/components/applications/
├── ApplicationList/
│   ├── ApplicationList.tsx              # Main list container
│   ├── ApplicationCard.tsx              # Individual application card
│   ├── ApplicationGrid.tsx              # Grid view for applications
│   ├── ApplicationSkeleton.tsx          # Loading skeleton
│   └── index.ts
├── ApplicationDetails/
│   ├── ApplicationDetails.tsx            # Main details view
│   ├── ApplicationTimeline.tsx          # Timeline component
│   ├── ApplicationNotes.tsx              # Notes and follow-ups
│   ├── ApplicationActions.tsx           # Action buttons
│   └── index.ts
├── ApplicationFilters/
│   ├── ApplicationFilters.tsx            # Filter panel
│   ├── StatusFilter.tsx                 # Status filter
│   ├── DateRangeFilter.tsx              # Date range filter
│   ├── CompanyFilter.tsx                # Company filter
│   └── index.ts
├── ApplicationAnalytics/
│   ├── AnalyticsDashboard.tsx           # Main analytics view
│   ├── SuccessRateChart.tsx             # Success rate visualization
│   ├── ResponseTimeChart.tsx            # Response time analysis
│   ├── ApplicationTrends.tsx            # Trend analysis
│   └── index.ts
├── RealTimeComponents/
│   ├── StatusIndicator.tsx              # Real-time status indicator
│   ├── NotificationCenter.tsx            # Notification center
│   ├── LiveUpdateBanner.tsx            # Live update banner
│   ├── WebSocketStatus.tsx              # Connection status
│   └── index.ts
└── Shared/
    ├── EmptyState.tsx                   # Empty state component
    ├── ErrorBoundary.tsx                # Error boundary
    ├── LoadingState.tsx                 # Loading state
    └── index.ts
```

### Technology Stack
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS 4+ with shadcn/ui components
- **State Management**: Zustand for local state, TanStack Query for server state
- **Real-time**: Socket.IO client for WebSocket connections
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React icons
- **Forms**: React Hook Form with Zod validation

## Core Application Components

### ApplicationList Component

#### Component Structure
```typescript
interface ApplicationListProps {
  applications: Application[];
  loading: boolean;
  viewMode: 'list' | 'grid';
  filters: ApplicationFilters;
  onFilterChange: (filters: ApplicationFilters) => void;
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onApplicationClick: (application: Application) => void;
  onRefresh: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
}
```

#### Features
- **Responsive Design**: Adapts to mobile, tablet, and desktop screens
- **Real-time Updates**: Live status changes via WebSocket
- **Infinite Scroll**: Progressive loading for large application lists
- **Search & Filter**: Advanced filtering with real-time results
- **View Modes**: Switch between list and grid layouts
- **Skeleton Loading**: Skeleton screens for better perceived performance
- **Empty States**: Helpful empty state when no applications exist
- **Error States**: Graceful error handling with retry options

#### UI Specification
```typescript
// Mobile Layout (< 768px)
<div className="container mx-auto px-4 py-6">
  <div className="space-y-4">
    <ApplicationFilters mobile />
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">My Applications</h1>
      <div className="flex items-center space-x-2">
        <ViewModeToggle />
        <FilterButton />
      </div>
    </div>
    <ApplicationList applications={applications} viewMode="list" />
    <LoadMoreButton hasMore={hasMore} />
  </div>
</div>

// Desktop Layout (>= 768px)
<div className="container mx-auto px-6 py-8">
  <div className="flex gap-6">
    <aside className="w-64 space-y-6">
      <ApplicationFilters desktop />
    </aside>
    <main className="flex-1">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Applications</h1>
        <div className="flex items-center space-x-4">
          <SearchInput />
          <ViewModeToggle />
          <ExportButton />
          <RefreshButton />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        <ApplicationList applications={applications} viewMode={viewMode} />
      </div>
    </main>
  </div>
</div>
```

#### Accessibility Features
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and landmarks
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliant color contrast
- **Reduced Motion**: Respect for prefers-reduced-motion

### ApplicationCard Component

#### Component Structure
```typescript
interface ApplicationCardProps {
  application: Application;
  viewMode: 'list' | 'grid';
  selected: boolean;
  onClick: (application: Application) => void;
  onStatusChange: (application: Application, status: ApplicationStatus) => void;
  onAddNote: (application: Application, note: string) => void;
  realtime: boolean;
  showAnalytics?: boolean;
}
```

#### List View Layout
```typescript
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="flex items-center space-x-3 mb-2">
        <CompanyLogo src={application.company.logo} alt={application.company.name} />
        <div>
          <h3 className="font-semibold text-gray-900">{application.jobTitle}</h3>
          <p className="text-sm text-gray-600">{application.company.name}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <StatusBadge status={application.status} realtime={realtime} />
        <MatchScore score={application.matchScore} />
        <span className="text-sm text-gray-500">
          Applied {formatDate(application.appliedAt)}
        </span>
      </div>

      {application.lastStatusChange && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Status Update:</span> {application.lastStatusChange.message}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {formatTime(application.lastStatusChange.timestamp)}
          </p>
        </div>
      )}

      {showAnalytics && application.analytics && (
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <EyeIcon className="h-4 w-4" />
            <span>{application.analytics.views} views</span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>{application.analytics.responseTime}h response</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUpIcon className="h-4 w-4" />
            <span>{Math.round(application.analytics.successProbability * 100)}% match</span>
          </div>
        </div>
      )}
    </div>

    <div className="flex flex-col items-center space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onViewDetails(application)}>
            <FileTextIcon className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddNote(application)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onWithdraw(application)}>
            <XIcon className="h-4 w-4 mr-2" />
            Withdraw
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {realtime && (
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      )}
    </div>
  </div>
</div>
```

#### Grid View Layout
```typescript
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <CompanyLogo src={application.company.logo} alt={application.company.name} size="sm" />
      <StatusBadge status={application.status} realtime={realtime} />
    </div>

    <div>
      <h3 className="font-semibold text-gray-900 line-clamp-2">{application.jobTitle}</h3>
      <p className="text-sm text-gray-600">{application.company.name}</p>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <MatchScore score={application.matchScore} size="sm" />
        <span className="text-xs text-gray-500">
          {formatDate(application.appliedAt)}
        </span>
      </div>

      <div className="flex items-center space-x-1">
        {realtime && (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  </div>
</div>
```

#### Real-time Features
- **Live Status Updates**: Animated status changes with smooth transitions
- **Connection Indicator**: Visual indication of WebSocket connection status
- **Conflict Resolution**: Optimistic updates with rollback on conflicts
- **Push Notifications**: Browser notifications for important updates

### ApplicationDetails Component

#### Component Structure
```typescript
interface ApplicationDetailsProps {
  application: ApplicationDetails;
  onStatusChange: (status: ApplicationStatus) => void;
  onAddNote: (note: string) => void;
  onWithdraw: (reason: string) => void;
  onScheduleInterview: (details: InterviewDetails) => void;
  realtime: boolean;
}
```

#### Layout Structure
```typescript
<div className="container mx-auto px-4 py-8 max-w-4xl">
  <div className="space-y-8">
    {/* Header Section */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <CompanyLogo src={application.company.logo} alt={application.company.name} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{application.jobTitle}</h1>
            <p className="text-lg text-gray-600">{application.company.name}</p>
            <div className="flex items-center space-x-4 mt-2">
              <StatusBadge status={application.status} size="lg" realtime={realtime} />
              <MatchScore score={application.matchScore} size="lg" />
              <span className="text-sm text-gray-500">
                Applied {formatDate(application.appliedAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={() => onScheduleInterview()}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
          <Button variant="outline" onClick={() => onAddNote()}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Note
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onWithdraw()}>
                <XIcon className="h-4 w-4 mr-2" />
                Withdraw Application
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => shareApplication()}>
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportApplication()}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Application Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent>
            <JobDetails job={application.job} />
          </CardContent>
        </Card>

        {/* Application Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Application Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationTimeline
              events={application.timeline}
              realtime={realtime}
              onEventClick={(event) => handleTimelineEventClick(event)}
            />
          </CardContent>
        </Card>

        {/* Application Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Application Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationAnalytics analytics={application.analytics} />
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Actions & Notes */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full" onClick={() => onScheduleInterview()}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Interview
              </Button>
              <Button variant="outline" className="w-full" onClick={() => onAddNote()}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button variant="outline" className="w-full" onClick={() => contactRecruiter()}>
                <MessageIcon className="h-4 w-4 mr-2" />
                Contact Recruiter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationNotes
              notes={application.notes}
              onAddNote={onAddNote}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
            />
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationRecommendations
              recommendations={application.aiRecommendations}
              onActionTaken={(action) => handleRecommendationAction(action)}
            />
          </CardContent>
        </Card>

        {/* Status Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Status Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusUpdates
              application={application}
              onStatusChange={onStatusChange}
              realtime={realtime}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</div>
```

### ApplicationTimeline Component

#### Component Structure
```typescript
interface ApplicationTimelineProps {
  events: TimelineEvent[];
  realtime: boolean;
  onEventClick: (event: TimelineEvent) => void;
  className?: string;
}
```

#### Timeline Layout
```typescript
<div className="relative">
  {/* Timeline Line */}
  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

  {/* Timeline Events */}
  <div className="space-y-6">
    {events.map((event, index) => (
      <div key={event.id} className="relative flex items-start space-x-4">
        {/* Timeline Dot */}
        <div className={cn(
          "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2",
          getEventColor(event.type),
          realtime && event.isNew && "animate-pulse"
        )}>
          {getEventIcon(event.type)}
        </div>

        {/* Event Content */}
        <div className="flex-1 min-w-0 pb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{event.title}</h3>
              <span className="text-sm text-gray-500">
                {formatTime(event.timestamp)}
              </span>
            </div>

            <p className="text-gray-700 mb-3">{event.description}</p>

            {event.metadata && (
              <div className="space-y-2">
                {event.metadata.recruiter && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4" />
                    <span>{event.metadata.recruiter}</span>
                  </div>
                )}

                {event.metadata.location && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{event.metadata.location}</span>
                  </div>
                )}

                {event.metadata.nextSteps && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Next Steps:</span> {event.metadata.nextSteps}
                    </p>
                  </div>
                )}
              </div>
            )}

            {event.actions && (
              <div className="flex items-center space-x-2 mt-3">
                {event.actions.map((action, actionIndex) => (
                  <Button
                    key={actionIndex}
                    size="sm"
                    variant="outline"
                    onClick={() => handleActionClick(action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

### ApplicationFilters Component

#### Component Structure
```typescript
interface ApplicationFiltersProps {
  filters: ApplicationFilters;
  onFiltersChange: (filters: ApplicationFilters) => void;
  mobile?: boolean;
  className?: string;
}
```

#### Filter Layout
```typescript
<div className="space-y-6">
  {/* Search */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Search
    </label>
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search by job title or company..."
        value={filters.search}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        className="pl-10"
      />
    </div>
  </div>

  {/* Status Filter */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Status
    </label>
    <div className="space-y-2">
      {Object.values(ApplicationStatus).map((status) => (
        <label key={status} className="flex items-center space-x-2">
          <Checkbox
            checked={filters.status?.includes(status) || false}
            onCheckedChange={(checked) => {
              const currentStatus = filters.status || [];
              const newStatus = checked
                ? [...currentStatus, status]
                : currentStatus.filter(s => s !== status);
              onFiltersChange({ ...filters, status: newStatus });
            }}
          />
          <StatusBadge status={status} size="sm" />
          <span className="text-sm text-gray-600">{getStatusLabel(status)}</span>
        </label>
      ))}
    </div>
  </div>

  {/* Date Range Filter */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Date Range
    </label>
    <div className="space-y-2">
      <Input
        type="date"
        value={filters.dateFrom || ''}
        onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
        className="w-full"
      />
      <Input
        type="date"
        value={filters.dateTo || ''}
        onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
        className="w-full"
      />
    </div>
  </div>

  {/* Company Filter */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Company
    </label>
    <Input
      placeholder="Filter by company..."
      value={filters.company || ''}
      onChange={(e) => onFiltersChange({ ...filters, company: e.target.value })}
    />
  </div>

  {/* Sort Options */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Sort By
    </label>
    <Select
      value={filters.sortBy || 'date'}
      onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
    >
      <SelectItem value="date">Date Applied</SelectItem>
      <SelectItem value="status">Status</SelectItem>
      <SelectItem value="company">Company</SelectItem>
      <SelectItem value="matchScore">Match Score</SelectItem>
    </Select>
  </div>

  {/* Clear Filters */}
  <Button
    variant="outline"
    className="w-full"
    onClick={() => onFiltersChange({})}
  >
    Clear Filters
  </Button>
</div>
```

## Real-time Components

### StatusIndicator Component

#### Component Structure
```typescript
interface StatusIndicatorProps {
  status: ApplicationStatus;
  realtime: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

#### Implementation
```typescript
<div className={cn(
  "flex items-center space-x-2",
  "px-3 py-1 rounded-full",
  getStatusColor(status),
  realtime && "animate-pulse",
  animated && "transition-all duration-300"
)}>
  <div className={cn(
    "w-2 h-2 rounded-full",
    realtime && "bg-green-500 animate-pulse"
  )} />
  <span className={cn(
    "text-xs font-medium",
    size === 'sm' && "text-xs",
    size === 'md' && "text-sm",
    size === 'lg' && "text-base"
  )}>
    {getStatusLabel(status)}
  </span>
  {realtime && (
    <span className="text-xs text-green-600">Live</span>
  )}
</div>
```

### NotificationCenter Component

#### Component Structure
```typescript
interface NotificationCenterProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onClearAll: () => void;
  maxVisible?: number;
}
```

#### Implementation
```typescript
<div className="relative">
  <Button variant="ghost" size="sm" className="relative">
    <BellIcon className="h-5 w-5" />
    {notifications.length > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {notifications.length > 99 ? '99+' : notifications.length}
      </span>
    )}
  </Button>

  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button />
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-80">
      <DropdownMenuLabel>
        <div className="flex items-center justify-between">
          <span>Notifications</span>
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <div className="max-h-96 overflow-y-auto">
        {notifications.slice(0, maxVisible || 10).map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            onClick={() => onNotificationClick(notification)}
            className="p-4 cursor-pointer"
          >
            <div className="flex items-start space-x-3">
              <div className={cn(
                "w-2 h-2 rounded-full mt-2",
                notification.type === 'success' && "bg-green-500",
                notification.type === 'warning' && "bg-yellow-500",
                notification.type === 'error' && "bg-red-500",
                notification.type === 'info' && "bg-blue-500"
              )} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(notification.timestamp)}
                </p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

## Analytics Components

### SuccessRateChart Component

#### Component Structure
```typescript
interface SuccessRateChartProps {
  data: SuccessRateData[];
  timeRange: '7d' | '30d' | '90d';
  onTimeRangeChange: (range: string) => void;
  interactive?: boolean;
}
```

#### Implementation
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Success Rate</CardTitle>
      <Select value={timeRange} onValueChange={onTimeRangeChange}>
        <SelectItem value="7d">Last 7 Days</SelectItem>
        <SelectItem value="30d">Last 30 Days</SelectItem>
        <SelectItem value="90d">Last 90 Days</SelectItem>
      </Select>
    </div>
  </CardHeader>
  <CardContent>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatChartDate(value)}
          />
          <YAxis
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Success Rate']}
            labelFormatter={(value) => formatChartDate(value)}
          />
          <Line
            type="monotone"
            dataKey="successRate"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div className="mt-4 grid grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900">
          {calculateAverage(data, 'successRate')}%
        </p>
        <p className="text-xs text-gray-600">Average</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-green-600">
          {calculateMax(data, 'successRate')}%
        </p>
        <p className="text-xs text-gray-600">Peak</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-blue-600">
          {calculateTrend(data, 'successRate')}
        </p>
        <p className="text-xs text-gray-600">Trend</p>
      </div>
    </div>
  </CardContent>
</Card>
```

## Mobile-Specific Components

### MobileApplicationList Component

#### Component Structure
```typescript
interface MobileApplicationListProps {
  applications: Application[];
  filters: ApplicationFilters;
  onFilterChange: (filters: ApplicationFilters) => void;
  onApplicationClick: (application: Application) => void;
  onRefresh: () => void;
}
```

#### Implementation
```typescript
<div className="bg-gray-50 min-h-screen">
  {/* Mobile Header */}
  <div className="bg-white border-b border-gray-200 px-4 py-4">
    <div className="flex items-center justify-between">
      <h1 className="text-lg font-semibold">Applications</h1>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <FilterIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>

  {/* Mobile Filters */}
  <div className="bg-white border-b border-gray-200 p-4">
    <MobileApplicationFilters
      filters={filters}
      onFiltersChange={onFilterChange}
    />
  </div>

  {/* Application List */}
  <div className="px-4 py-4 space-y-4">
    {applications.map((application) => (
      <MobileApplicationCard
        key={application.id}
        application={application}
        onClick={() => onApplicationClick(application)}
      />
    ))}
  </div>

  {/* Floating Action Button */}
  <div className="fixed bottom-4 right-4">
    <Button size="lg" className="rounded-full shadow-lg">
      <PlusIcon className="h-5 w-5" />
    </Button>
  </div>
</div>
```

### MobileApplicationCard Component

#### Implementation
```typescript
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
  <div className="flex items-start space-x-3">
    <CompanyLogo src={application.company.logo} alt={application.company.name} size="sm" />
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900 line-clamp-1">
        {application.jobTitle}
      </h3>
      <p className="text-sm text-gray-600">{application.company.name}</p>
      <div className="flex items-center space-x-2 mt-2">
        <StatusBadge status={application.status} size="sm" />
        <MatchScore score={application.matchScore} size="sm" />
      </div>
    </div>
  </div>

  <div className="mt-4 flex items-center justify-between">
    <span className="text-xs text-gray-500">
      {formatDate(application.appliedAt)}
    </span>
    <div className="flex items-center space-x-1">
      {application.realtime && (
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
    </div>
  </div>
</div>
```

## Accessibility Features

### Screen Reader Support
- **Semantic HTML**: Proper use of headings, lists, and landmarks
- **ARIA Labels**: Comprehensive ARIA labeling for all interactive elements
- **Live Regions**: Dynamic content updates with proper live region announcements
- **Focus Management**: Logical tab order and visible focus indicators

### Keyboard Navigation
- **Full Keyboard Support**: All functionality accessible via keyboard
- **Skip Links**: Quick navigation to main content areas
- **Shortcuts**: Keyboard shortcuts for common actions
- **Modal Focus**: Proper focus management in dialogs and modals

### Visual Accessibility
- **High Contrast**: Support for high contrast modes
- **Color Blindness**: Design works for all types of color blindness
- **Text Scaling**: Text scales properly up to 200%
- **Motion Control**: Respect for prefers-reduced-motion

## Performance Considerations

### Code Splitting
- **Lazy Loading**: Components loaded on demand
- **Route-based Splitting**: Separate bundles for different routes
- **Component Splitting**: Heavy components split into smaller chunks

### Optimization
- **Memoization**: React.memo for expensive renders
- **Virtualization**: For long lists of applications
- **Debouncing**: Search and filter inputs debounced
- **Throttling**: Resize and scroll events throttled

### Caching
- **Component Caching**: Cached component states
- **Data Caching**: API responses cached appropriately
- **Image Optimization**: Optimized images with lazy loading

## Testing Strategy

### Unit Tests
- Component isolation testing
- Hook testing with testing library
- Mock external dependencies
- Accessibility testing with axe-core

### Integration Tests
- Component interaction testing
- Real-time update testing
- WebSocket integration testing
- API integration testing

### E2E Tests
- Complete user flows
- Mobile experience testing
- Accessibility testing
- Performance testing

## Conclusion

The UI components for the Applications Management System are designed to provide a comprehensive, responsive, and accessible user experience. The components leverage modern React patterns, real-time updates, and intelligent features to create an engaging and effective application management platform.

The components are built with performance, accessibility, and maintainability in mind, ensuring that they can scale effectively while providing a consistent and enjoyable user experience across all devices.

---

**Next Steps**: Implement the components following the specifications, starting with the core ApplicationList and ApplicationCard components, then adding the real-time features and analytics components.