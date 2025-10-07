'use client'

import { Bell, Check, CheckCheck, X, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications, EnhancedNotificationData } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { NotificationData } from '@/lib/notifications'
import { useRouter } from 'next/navigation'

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'application_status':
    case 'application_update':
      return '📋'
    case 'new_job':
      return '💼'
    case 'application_received':
      return '📨'
    case 'job_match':
      return '🎯'
    case 'profile_view':
      return '👁️'
    case 'system':
      return '⚙️'
    case 'marketing':
      return '📢'
    default:
      return '🔔'
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'application_status':
    case 'application_update':
      return 'text-blue-600'
    case 'new_job':
      return 'text-green-600'
    case 'application_received':
      return 'text-purple-600'
    case 'job_match':
      return 'text-orange-600'
    case 'profile_view':
      return 'text-indigo-600'
    case 'system':
      return 'text-gray-600'
    case 'marketing':
      return 'text-pink-600'
    default:
      return 'text-gray-600'
  }
}

export function NotificationDropdown() {
  const router = useRouter()
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
    sendTestNotification,
    trackEvent,
    refresh
  } = useNotifications({ limit: 10 })

  const handleNotificationClick = async (notification: EnhancedNotificationData) => {
    // Track analytics event
    await trackEvent(notification.id, 'clicked', {
      type: notification.type,
      channel: notification.channel,
    })

    // Mark as read if needed
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'application_status':
      case 'application_update':
        if (notification.data?.applicationId) {
          router.push('/applications')
        } else {
          router.push('/applications')
        }
        break
      case 'new_job':
      case 'job_match':
        if (notification.data?.jobId) {
          router.push(`/jobs/${notification.data.jobId}`)
        } else {
          router.push('/jobs')
        }
        break
      case 'application_received':
        if (notification.data?.jobId) {
          router.push('/employer/jobs')
        } else {
          router.push('/employer/dashboard')
        }
        break
      case 'profile_view':
        router.push('/profile')
        break
      case 'system':
        // System notifications might have action URLs
        if (notification.data?.actionUrl) {
          router.push(notification.data.actionUrl)
        }
        break
      case 'marketing':
        if (notification.data?.actionUrl) {
          router.push(notification.data.actionUrl)
        }
        break
      default:
        // Default to dashboard if no specific route
        router.push('/dashboard')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {error && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" title="Error loading notifications" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            Notifications
            {isLoading && (
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" title="Loading..." />
            )}
          </span>
          <div className="flex items-center gap-1">
            {error && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  refresh()
                }}
                className="h-6 px-2 text-xs text-red-600"
                title="Retry loading notifications"
              >
                🔄
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  markAllAsRead()
                }}
                className="h-6 px-2 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                clearAll()
              }}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-96">
          {error && (
            <div className="p-4 text-center text-sm text-red-600">
              <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center">⚠️</div>
              <p>Failed to load notifications</p>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                className="mt-2 text-xs"
              >
                Try again
              </Button>
            </div>
          )}

          {isLoading && notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <div className="h-8 w-8 mx-auto mb-2 flex items-center justify-center">
                <Bell className="animate-pulse" />
              </div>
              <p>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 && !error ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={sendTestNotification}
                className="mt-2 text-xs"
              >
                Send test notification
              </Button>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={
                    "flex items-start gap-3 p-3 cursor-pointer" +
                    (!notification.read ? " bg-blue-50 border-l-2 border-blue-500" : "")
                  }
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={"text-lg " + getNotificationColor(notification.type)}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={
                        "text-sm font-medium " +
                        (!notification.read ? "text-blue-900" : "text-gray-900")
                      }>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      )}
                      {notification.priority === 'urgent' && (
                        <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" title="Urgent" />
                      )}
                    </div>

                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true
                        })}
                      </p>
                      <div className="flex items-center gap-1">
                        <div className={`h-1.5 w-1.5 rounded-full ${
                          notification.channel === 'email' ? 'bg-blue-400' :
                          notification.channel === 'sms' ? 'bg-green-400' :
                          notification.channel === 'push' ? 'bg-purple-400' :
                          'bg-gray-400'
                        }`} title={notification.channel} />
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}

              {/* Load more button */}
              {notifications.length > 0 && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = '/notifications'}
                    className="w-full text-xs"
                  >
                    View all notifications
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                Loading...
              </>
            ) : error ? (
              <>
                <div className="h-2 w-2 bg-red-500 rounded-full" />
                Error
              </>
            ) : (
              <>
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                Connected
              </>
            )}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/notifications/settings'}
              className="h-6 px-2"
              title="Notification settings"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}