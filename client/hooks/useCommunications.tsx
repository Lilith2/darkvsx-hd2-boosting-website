import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface Communication {
  id: string;
  user_id: string;
  type: 'email' | 'sms' | 'push' | 'in_app' | 'system';
  template_name: string | null;
  subject: string | null;
  content: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  sent_at: string | null;
  delivered_at: string | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
}

export interface CommunicationFilters {
  userId?: string;
  type?: 'email' | 'sms' | 'push' | 'in_app' | 'system';
  status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  startDate?: string;
  endDate?: string;
  templateName?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  category: 'order_updates' | 'marketing' | 'security' | 'system' | 'all';
  enabled: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface CommunicationsContextType {
  communications: Communication[];
  loading: boolean;
  error: string | null;
  
  // Communication Management
  sendCommunication: (communicationData: Partial<Communication>) => Promise<string>;
  sendEmail: (
    userId: string,
    email: string,
    subject: string,
    content: string,
    options?: {
      templateName?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      scheduledFor?: string;
      metadata?: Record<string, any>;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }
  ) => Promise<string>;
  sendSMS: (
    userId: string,
    phone: string,
    content: string,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      scheduledFor?: string;
      metadata?: Record<string, any>;
    }
  ) => Promise<string>;
  sendInAppNotification: (
    userId: string,
    subject: string,
    content: string,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      metadata?: Record<string, any>;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }
  ) => Promise<string>;
  sendOrderNotification: (
    userId: string,
    orderId: string,
    type: 'created' | 'updated' | 'completed' | 'cancelled',
    userEmail?: string
  ) => Promise<void>;
  sendSystemAlert: (
    userId: string,
    message: string,
    priority?: 'low' | 'normal' | 'high' | 'urgent'
  ) => Promise<string>;
  
  // Communication Status
  updateCommunicationStatus: (
    id: string,
    status: 'sent' | 'delivered' | 'failed' | 'cancelled',
    errorMessage?: string
  ) => Promise<void>;
  retryCommunication: (id: string) => Promise<void>;
  cancelCommunication: (id: string) => Promise<void>;
  
  // Fetching
  getCommunications: (filters?: CommunicationFilters) => Promise<Communication[]>;
  getUserCommunications: (userId: string, filters?: CommunicationFilters) => Promise<Communication[]>;
  getPendingCommunications: () => Promise<Communication[]>;
  getFailedCommunications: () => Promise<Communication[]>;
  getCommunicationById: (id: string) => Promise<Communication | null>;
  
  // Bulk Operations
  bulkSendCommunications: (communications: Partial<Communication>[]) => Promise<string[]>;
  bulkUpdateStatus: (ids: string[], status: string, errorMessage?: string) => Promise<void>;
  bulkCancel: (ids: string[]) => Promise<void>;
  
  // Templates and Preferences
  getUserNotificationPreferences: (userId: string) => Promise<NotificationPreference[]>;
  updateNotificationPreference: (
    userId: string,
    type: 'email' | 'sms' | 'push' | 'in_app',
    category: string,
    enabled: boolean
  ) => Promise<void>;
  canSendNotification: (userId: string, type: 'email' | 'sms' | 'push' | 'in_app', category: string) => Promise<boolean>;
  
  // Analytics
  getCommunicationStats: (filters?: CommunicationFilters) => Promise<{
    total_sent: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
  }>;
  
  // Utility
  refreshCommunications: () => Promise<void>;
  clearError: () => void;
}

const CommunicationsContext = createContext<CommunicationsContextType | undefined>(undefined);

export const useCommunications = () => {
  const context = useContext(CommunicationsContext);
  if (context === undefined) {
    throw new Error('useCommunications must be used within a CommunicationsProvider');
  }
  return context;
};

interface CommunicationsProviderProps {
  children: ReactNode;
}

export const CommunicationsProvider = ({ children }: CommunicationsProviderProps) => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle errors
  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    setError(error?.message || `Failed to ${operation}`);
    throw error;
  };

  // Send a general communication
  const sendCommunication = async (communicationData: Partial<Communication>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('communications')
        .insert([{
          ...communicationData,
          status: communicationData.status || 'pending',
          priority: communicationData.priority || 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      
      await refreshCommunications();
      return data.id;
    } catch (error) {
      handleError(error, 'send communication');
      return '';
    } finally {
      setLoading(false);
    }
  };

  // Send email
  const sendEmail = async (
    userId: string,
    email: string,
    subject: string,
    content: string,
    options?: {
      templateName?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      scheduledFor?: string;
      metadata?: Record<string, any>;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }
  ): Promise<string> => {
    return sendCommunication({
      user_id: userId,
      type: 'email',
      template_name: options?.templateName,
      subject,
      content,
      recipient_email: email,
      priority: options?.priority || 'normal',
      scheduled_for: options?.scheduledFor,
      metadata: options?.metadata,
      related_entity_type: options?.relatedEntityType,
      related_entity_id: options?.relatedEntityId,
    });
  };

  // Send SMS
  const sendSMS = async (
    userId: string,
    phone: string,
    content: string,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      scheduledFor?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<string> => {
    return sendCommunication({
      user_id: userId,
      type: 'sms',
      content,
      recipient_phone: phone,
      priority: options?.priority || 'normal',
      scheduled_for: options?.scheduledFor,
      metadata: options?.metadata,
    });
  };

  // Send in-app notification
  const sendInAppNotification = async (
    userId: string,
    subject: string,
    content: string,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      metadata?: Record<string, any>;
      relatedEntityType?: string;
      relatedEntityId?: string;
    }
  ): Promise<string> => {
    return sendCommunication({
      user_id: userId,
      type: 'in_app',
      subject,
      content,
      priority: options?.priority || 'normal',
      metadata: options?.metadata,
      related_entity_type: options?.relatedEntityType,
      related_entity_id: options?.relatedEntityId,
    });
  };

  // Send order notification
  const sendOrderNotification = async (
    userId: string,
    orderId: string,
    type: 'created' | 'updated' | 'completed' | 'cancelled',
    userEmail?: string
  ): Promise<void> => {
    const titles = {
      created: 'Order Confirmation',
      updated: 'Order Update',
      completed: 'Order Completed',
      cancelled: 'Order Cancelled',
    };

    const contents = {
      created: 'Your order has been successfully created and is being processed.',
      updated: 'Your order status has been updated.',
      completed: 'Your order has been completed and is ready.',
      cancelled: 'Your order has been cancelled.',
    };

    const promises = [];

    // Send in-app notification
    promises.push(
      sendInAppNotification(
        userId,
        titles[type],
        contents[type],
        {
          priority: type === 'completed' ? 'high' : 'normal',
          relatedEntityType: 'order',
          relatedEntityId: orderId,
          metadata: { order_id: orderId, notification_type: type },
        }
      )
    );

    // Send email if email is provided
    if (userEmail) {
      promises.push(
        sendEmail(
          userId,
          userEmail,
          titles[type],
          contents[type],
          {
            templateName: `order_${type}`,
            priority: type === 'completed' ? 'high' : 'normal',
            relatedEntityType: 'order',
            relatedEntityId: orderId,
            metadata: { order_id: orderId, notification_type: type },
          }
        )
      );
    }

    await Promise.all(promises);
  };

  // Send system alert
  const sendSystemAlert = async (
    userId: string,
    message: string,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string> => {
    return sendCommunication({
      user_id: userId,
      type: 'system',
      subject: 'System Alert',
      content: message,
      priority,
      metadata: { alert_type: 'system' },
    });
  };

  // Update communication status
  const updateCommunicationStatus = async (
    id: string,
    status: 'sent' | 'delivered' | 'failed' | 'cancelled',
    errorMessage?: string
  ): Promise<void> => {
    try {
      setError(null);

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (status === 'failed' && errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('communications')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      await refreshCommunications();
    } catch (error) {
      handleError(error, 'update communication status');
    }
  };

  // Retry communication
  const retryCommunication = async (id: string): Promise<void> => {
    await updateCommunicationStatus(id, 'pending');
  };

  // Cancel communication
  const cancelCommunication = async (id: string): Promise<void> => {
    await updateCommunicationStatus(id, 'cancelled');
  };

  // Get communications with filters
  const getCommunications = async (filters?: CommunicationFilters): Promise<Communication[]> => {
    try {
      setError(null);

      let query = supabase.from('communications').select('*');

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters?.templateName) {
        query = query.eq('template_name', filters.templateName);
      }
      if (filters?.relatedEntityType) {
        query = query.eq('related_entity_type', filters.relatedEntityType);
      }
      if (filters?.relatedEntityId) {
        query = query.eq('related_entity_id', filters.relatedEntityId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'get communications');
      return [];
    }
  };

  // Get user communications
  const getUserCommunications = async (userId: string, filters?: CommunicationFilters): Promise<Communication[]> => {
    return getCommunications({ ...filters, userId });
  };

  // Get pending communications
  const getPendingCommunications = async (): Promise<Communication[]> => {
    return getCommunications({ status: 'pending' });
  };

  // Get failed communications
  const getFailedCommunications = async (): Promise<Communication[]> => {
    return getCommunications({ status: 'failed' });
  };

  // Get communication by ID
  const getCommunicationById = async (id: string): Promise<Communication | null> => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleError(error, 'get communication by ID');
      return null;
    }
  };

  // Bulk send communications
  const bulkSendCommunications = async (communications: Partial<Communication>[]): Promise<string[]> => {
    try {
      setLoading(true);
      setError(null);

      const communicationsWithDefaults = communications.map(comm => ({
        ...comm,
        status: comm.status || 'pending',
        priority: comm.priority || 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('communications')
        .insert(communicationsWithDefaults)
        .select();

      if (error) throw error;
      
      await refreshCommunications();
      return data.map(comm => comm.id);
    } catch (error) {
      handleError(error, 'bulk send communications');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Bulk update status
  const bulkUpdateStatus = async (ids: string[], status: string, errorMessage?: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('communications')
        .update(updateData)
        .in('id', ids);

      if (error) throw error;
      
      await refreshCommunications();
    } catch (error) {
      handleError(error, 'bulk update status');
    } finally {
      setLoading(false);
    }
  };

  // Bulk cancel
  const bulkCancel = async (ids: string[]): Promise<void> => {
    await bulkUpdateStatus(ids, 'cancelled');
  };

  // Get user notification preferences
  const getUserNotificationPreferences = async (userId: string): Promise<NotificationPreference[]> => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return [];
    }
  };

  // Update notification preference
  const updateNotificationPreference = async (
    userId: string,
    type: 'email' | 'sms' | 'push' | 'in_app',
    category: string,
    enabled: boolean
  ): Promise<void> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          type,
          category,
          enabled,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notification preference:', error);
    }
  };

  // Check if notification can be sent
  const canSendNotification = async (
    userId: string,
    type: 'email' | 'sms' | 'push' | 'in_app',
    category: string
  ): Promise<boolean> => {
    try {
      const preferences = await getUserNotificationPreferences(userId);
      const preference = preferences.find(p => p.type === type && p.category === category);
      return preference ? preference.enabled : true; // Default to enabled if no preference set
    } catch (error) {
      console.error('Error checking notification preference:', error);
      return true; // Default to allowing notifications
    }
  };

  // Get communication statistics
  const getCommunicationStats = async (filters?: CommunicationFilters) => {
    try {
      setError(null);

      const communications = await getCommunications(filters);

      const total_sent = communications.filter(c => c.status === 'sent').length;
      const total_delivered = communications.filter(c => c.status === 'delivered').length;
      const total_failed = communications.filter(c => c.status === 'failed').length;
      
      const delivery_rate = total_sent > 0 ? (total_delivered / total_sent) * 100 : 0;

      const by_type = communications.reduce((acc, comm) => {
        acc[comm.type] = (acc[comm.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const by_status = communications.reduce((acc, comm) => {
        acc[comm.status] = (acc[comm.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total_sent,
        total_delivered,
        total_failed,
        delivery_rate,
        by_type,
        by_status,
      };
    } catch (error) {
      handleError(error, 'get communication stats');
      return {
        total_sent: 0,
        total_delivered: 0,
        total_failed: 0,
        delivery_rate: 0,
        by_type: {},
        by_status: {},
      };
    }
  };

  // Refresh communications from database
  const refreshCommunications = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCommunications(data || []);
    } catch (error) {
      handleError(error, 'refresh communications');
    } finally {
      setLoading(false);
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Load communications on mount
  useEffect(() => {
    refreshCommunications();
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('communications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communications',
        },
        () => {
          refreshCommunications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value: CommunicationsContextType = {
    communications,
    loading,
    error,
    sendCommunication,
    sendEmail,
    sendSMS,
    sendInAppNotification,
    sendOrderNotification,
    sendSystemAlert,
    updateCommunicationStatus,
    retryCommunication,
    cancelCommunication,
    getCommunications,
    getUserCommunications,
    getPendingCommunications,
    getFailedCommunications,
    getCommunicationById,
    bulkSendCommunications,
    bulkUpdateStatus,
    bulkCancel,
    getUserNotificationPreferences,
    updateNotificationPreference,
    canSendNotification,
    getCommunicationStats,
    refreshCommunications,
    clearError,
  };

  return (
    <CommunicationsContext.Provider value={value}>
      {children}
    </CommunicationsContext.Provider>
  );
};
