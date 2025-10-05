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
import { useNotifications } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { NotificationData } from '@/lib/notifications'

const getNotificationIcon = (type: NotificationData['type']) => {
  switch (type) {
    case 'application_status':
      return '📋'
    case 'new_job':
      return '💼'
    case 'application_received':
      return '📨'
    case 'job_match':
      return '🎯'
    default:
      return '🔔'
  }
}

const getNotificationColor = (type: NotificationData['type']) => {
  switch (type) {
    case 'application_status':
      return 'text-blue-600'
    case 'new_job':
      return 'text-green-600'
    case 'application_received':
      return 'text-purple-600'
    case 'job_match':
      return 'text-orange-600'
    default:
      return 'text-gray-600'
  }
}

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    sendTestNotification
  } = useNotifications()

  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'application_status':
        if (notification.data?.applicationId) {
          window.location.href = '/applications'
        }
        break
      case 'new_job':
      case 'job_match':
        if (notification.data?.jobId) {
          window.location.href = `/jobs/${notification.data.jobId}`
        }
        break
      case 'application_received':
        if (notification.data?.jobId) {
          window.location.href = `/employer/dashboard`
        }
        break
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-1">
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
          {notifications.length === 0 ? (
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
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(notification.timestamp), { 
                        addSuffix: true 
                      })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Connected
          </span>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Settings className="h-3 w-3" />
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}