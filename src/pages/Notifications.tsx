import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Trash2, Bell, Filter } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotifications } from '@/hooks/useNotifications';
import { NOTIFICATION_CONFIG, NotificationType } from '@/types/notifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { cs } from 'date-fns/locale';

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  new_lead: 'Nový lead',
  form_completed: 'Formulář vyplněn',
  contract_signed: 'Smlouva podepsána',
  lead_converted: 'Lead převeden',
  access_granted: 'Přístupy uděleny',
  offer_sent: 'Nabídka odeslána',
  colleague_birthday: 'Narozeniny kolegy',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (tab === 'unread' && n.read) return false;
    if (filterType !== 'all' && n.type !== filterType) return false;
    return true;
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return formatDistanceToNow(date, { addSuffix: true, locale: cs });
    } else if (diffDays < 7) {
      return format(date, 'EEEE, HH:mm', { locale: cs });
    } else {
      return format(date, 'd. MMMM yyyy, HH:mm', { locale: cs });
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      <PageHeader
        title="🔔 Notifikace"
        description="Přehled všech upozornění a událostí"
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Označit vše jako přečtené
            </Button>
          ) : null
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'all' | 'unread')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="all">
              Všechny
              <Badge variant="secondary" className="ml-2 text-xs">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Nepřečtené
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Select value={filterType} onValueChange={(v) => setFilterType(v as NotificationType | 'all')}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrovat typ" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Všechny typy</SelectItem>
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, label]) => (
                <SelectItem key={type} value={type}>
                  {NOTIFICATION_CONFIG[type as NotificationType].icon} {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all" className="mt-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Žádné notifikace k zobrazení</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const config = NOTIFICATION_CONFIG[notification.type];
              return (
                <Card 
                  key={notification.id}
                  className={cn(
                    'cursor-pointer hover:shadow-md transition-all hover:border-primary/30',
                    !notification.read && 'border-primary/30 bg-primary/5'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      'flex items-center justify-center h-11 w-11 rounded-full shrink-0 text-xl',
                      config.bgColor
                    )}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            'font-medium',
                            !notification.read && 'text-foreground',
                            notification.read && 'text-muted-foreground'
                          )}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {NOTIFICATION_TYPE_LABELS[notification.type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          title="Označit jako přečtené"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        title="Smazat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Všechny notifikace jsou přečtené</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const config = NOTIFICATION_CONFIG[notification.type];
              return (
                <Card 
                  key={notification.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 border-primary/30 bg-primary/5"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={cn(
                      'flex items-center justify-center h-11 w-11 rounded-full shrink-0 text-xl',
                      config.bgColor
                    )}>
                      {config.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{notification.title}</h3>
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {NOTIFICATION_TYPE_LABELS[notification.type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Označit jako přečtené"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        title="Smazat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
