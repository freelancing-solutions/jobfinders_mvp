import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { QueueManager } from '@/lib/services/messageQueue/QueueManager';
import { PriorityProcessor } from '@/lib/services/messageQueue/PriorityProcessor';
import { MonitoringService } from '@/lib/services/messageQueue/MonitoringService';
import { SchedulerService } from '@/lib/services/messageQueue/SchedulerService';

// Initialize services
const queueManager = QueueManager.getInstance();
const priorityProcessor = PriorityProcessor.getInstance();
const monitoringService = MonitoringService.getInstance();
const schedulerService = SchedulerService.getInstance();

// Request schemas
const SendMessageSchema = z.object({
  queueName: z.string(),
  type: z.string(),
  payload: z.any(),
  options: z.object({
    priority: z.enum(['high', 'normal', 'low']).optional(),
    delay: z.number().optional(),
    correlationId: z.string().optional(),
    replyTo: z.string().optional(),
    expiresAt: z.number().optional(),
    metadata: z.record(z.any()).optional()
  }).optional()
});

const SendBatchSchema = z.object({
  queueName: z.string(),
  messages: z.array(z.object({
    type: z.string(),
    payload: z.any(),
    options: z.object({
      priority: z.enum(['high', 'normal', 'low']).optional(),
      delay: z.number().optional(),
      correlationId: z.string().optional(),
      replyTo: z.string().optional(),
      metadata: z.record(z.any()).optional()
    }).optional()
  }))
});

const ScheduleMessageSchema = z.object({
  queueName: z.string(),
  type: z.string(),
  payload: z.any(),
  scheduleTime: z.string().datetime(),
  options: z.object({
    correlationId: z.string().optional(),
    replyTo: z.string().optional(),
    metadata: z.record(z.any()).optional()
  }).optional()
});

const CreateScheduleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  queue: z.string(),
  type: z.string(),
  payload: z.any(),
  schedule: z.string(),
  timezone: z.string().optional(),
  maxOccurrences: z.number().optional(),
  metadata: z.record(z.any()).optional()
});

const PriorityRuleSchema = z.object({
  name: z.string(),
  condition: z.string(), // In production, this would be a proper expression parser
  priority: z.number(),
  queue: z.string(),
  metadata: z.record(z.any()).optional()
});

const RoutingRuleSchema = z.object({
  name: z.string(),
  condition: z.string(),
  targetQueue: z.string(),
  metadata: z.record(z.any()).optional()
});

const FilterRuleSchema = z.object({
  name: z.string(),
  condition: z.string(),
  action: z.enum(['accept', 'reject', 'transform']),
  rejectionReason: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const AlertRuleSchema = z.object({
  name: z.string(),
  type: z.enum(['queue_depth', 'error_rate', 'latency', 'consumer_health', 'system_health']),
  condition: z.string(),
  threshold: z.number(),
  comparison: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
  severity: z.enum(['info', 'warning', 'critical']),
  queueFilter: z.string().optional(),
  cooldownPeriod: z.number().optional(),
  notificationChannels: z.array(z.string()).optional()
});

// GET /api/message-queue - Get queue information and metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'queues', 'metrics', 'health', 'schedules', 'stats'

    switch (type) {
      case 'queues':
        return await getQueues();
      case 'metrics':
        return await getMetrics();
      case 'health':
        return await getHealthStatus();
      case 'schedules':
        return await getSchedules();
      case 'stats':
        return await getStats();
      case 'rules':
        return await getRules();
      case 'alerts':
        return await getAlerts();
      default:
        return await getSystemOverview();
    }
  } catch (error) {
    console.error('Error in message-queue GET:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// POST /api/message-queue - Queue operations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'send_message':
        return await sendMessage(body);
      case 'send_batch':
        return await sendBatchMessages(body);
      case 'schedule_message':
        return await scheduleMessage(body);
      case 'create_schedule':
        return await createSchedule(body);
      case 'execute_schedule':
        return await executeSchedule(body);
      case 'test_rules':
        return await testRules(body);
      case 'validate_cron':
        return await validateCron(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in message-queue POST:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// PUT /api/message-queue - Update operations
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update_schedule':
        return await updateSchedule(body);
      case 'add_priority_rule':
        return await addPriorityRule(body);
      case 'add_routing_rule':
        return await addRoutingRule(body);
      case 'add_filter_rule':
        return await addFilterRule(body);
      case 'add_alert_rule':
        return await addAlertRule(body);
      case 'resolve_alert':
        return await resolveAlert(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in message-queue PUT:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// DELETE /api/message-queue - Delete operations
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'delete_schedule':
        return await deleteSchedule(body);
      case 'delete_priority_rule':
        return await deletePriorityRule(body);
      case 'delete_routing_rule':
        return await deleteRoutingRule(body);
      case 'delete_filter_rule':
        return await deleteFilterRule(body);
      case 'delete_alert_rule':
        return await deleteAlertRule(body);
      case 'purge_queue':
        return await purgeQueue(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in message-queue DELETE:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

// Helper functions

async function getQueues() {
  try {
    const queueMetrics = await queueManager.getQueueMetrics();
    const queueInfos = await Promise.all(
      queueMetrics.map(async (metric) => {
        const info = await queueManager.getQueueInfo(metric.queueName);
        return { metric, info };
      })
    );

    return NextResponse.json({
      queues: queueInfos,
      totalQueues: queueMetrics.length,
      totalDepth: queueMetrics.reduce((sum, q) => sum + q.depth, 0),
      totalProcessingRate: queueMetrics.reduce((sum, q) => sum + q.processingRate, 0)
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch queue information' }, { status: 500 });
  }
}

async function getMetrics() {
  try {
    const metrics = await monitoringService.getMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}

async function getHealthStatus() {
  try {
    const health = await monitoringService.getHealthStatus();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get health status' }, { status: 500 });
  }
}

async function getSchedules() {
  try {
    const schedules = schedulerService.getSchedules();
    const upcoming = await schedulerService.getUpcomingExecutions(10);

    return NextResponse.json({
      schedules,
      upcoming,
      totalSchedules: schedules.length,
      activeSchedules: schedules.filter(s => s.isActive).length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

async function getStats() {
  try {
    const systemOverview = await monitoringService.getSystemOverview();
    const schedulerStats = schedulerService.getStats();
    const processingStats = priorityProcessor.getProcessingStats();

    return NextResponse.json({
      system: systemOverview,
      scheduler: schedulerStats,
      processing: processingStats
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

async function getRules() {
  try {
    const priorityRules = priorityProcessor.getPriorityRules();
    const routingRules = priorityProcessor.getRoutingRules();
    const filterRules = priorityProcessor.getFilterRules();
    const throttleRules = priorityProcessor.getThrottleRules();

    return NextResponse.json({
      priority: priorityRules,
      routing: routingRules,
      filter: filterRules,
      throttle: throttleRules
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

async function getAlerts() {
  try {
    const activeAlerts = monitoringService.getActiveAlerts();
    const alertRules = monitoringService.getAlertRules();

    return NextResponse.json({
      active: activeAlerts,
      rules: alertRules,
      totalActive: activeAlerts.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

async function getSystemOverview() {
  try {
    const overview = await monitoringService.getSystemOverview();
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch system overview' }, { status: 500 });
  }
}

async function sendMessage(body: any) {
  try {
    const { queueName, type, payload, options } = SendMessageSchema.parse(body);

    const messageId = await queueManager.sendMessage(queueName, type, payload, options);

    return NextResponse.json({
      success: true,
      messageId,
      queue: queueName,
      type
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

async function sendBatchMessages(body: any) {
  try {
    const { queueName, messages } = SendBatchSchema.parse(body);

    const messageIds = await queueManager.sendBatch(queueName, messages);

    return NextResponse.json({
      success: true,
      messageIds,
      count: messageIds.length,
      queue: queueName
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send batch messages' }, { status: 500 });
  }
}

async function scheduleMessage(body: any) {
  try {
    const { queueName, type, payload, scheduleTime, options } = ScheduleMessageSchema.parse(body);

    const messageId = await queueManager.scheduleMessage(
      queueName,
      type,
      payload,
      new Date(scheduleTime),
      options
    );

    return NextResponse.json({
      success: true,
      messageId,
      queue: queueName,
      type,
      scheduledFor: scheduleTime
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to schedule message' }, { status: 500 });
  }
}

async function createSchedule(body: any) {
  try {
    const scheduleData = CreateScheduleSchema.parse(body);

    const schedule = await schedulerService.createSchedule(scheduleData);

    return NextResponse.json({
      success: true,
      schedule
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

async function executeSchedule(body: any) {
  try {
    const { scheduleId } = body;

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const result = await schedulerService.executeNow(scheduleId);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to execute schedule' }, { status: 500 });
  }
}

async function testRules(body: any) {
  try {
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required for testing' }, { status: 400 });
    }

    const result = await priorityProcessor.testRules(message);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to test rules' }, { status: 500 });
  }
}

async function validateCron(body: any) {
  try {
    const { cronExpression } = body;

    if (!cronExpression) {
      return NextResponse.json({ error: 'Cron expression is required' }, { status: 400 });
    }

    const result = await schedulerService.validateCronExpression(cronExpression);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to validate cron expression' }, { status: 500 });
  }
}

async function updateSchedule(body: any) {
  try {
    const { scheduleId, updates } = body;

    if (!scheduleId || !updates) {
      return NextResponse.json({ error: 'Schedule ID and updates are required' }, { status: 400 });
    }

    const success = await schedulerService.updateSchedule(scheduleId, updates);

    return NextResponse.json({
      success,
      scheduleId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

async function addPriorityRule(body: any) {
  try {
    const ruleData = PriorityRuleSchema.parse(body);

    const rule = {
      id: `priority_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      condition: () => true, // In production, this would parse the condition string
      ...ruleData,
      isActive: true,
      createdAt: new Date()
    };

    priorityProcessor.addPriorityRule(rule);

    return NextResponse.json({
      success: true,
      rule
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add priority rule' }, { status: 500 });
  }
}

async function addRoutingRule(body: any) {
  try {
    const ruleData = RoutingRuleSchema.parse(body);

    const rule = {
      id: `routing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      condition: () => true, // In production, this would parse the condition string
      ...ruleData,
      isActive: true,
      createdAt: new Date()
    };

    priorityProcessor.addRoutingRule(rule);

    return NextResponse.json({
      success: true,
      rule
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add routing rule' }, { status: 500 });
  }
}

async function addFilterRule(body: any) {
  try {
    const ruleData = FilterRuleSchema.parse(body);

    const rule = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      condition: () => true, // In production, this would parse the condition string
      ...ruleData,
      isActive: true,
      createdAt: new Date()
    };

    priorityProcessor.addFilterRule(rule);

    return NextResponse.json({
      success: true,
      rule
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add filter rule' }, { status: 500 });
  }
}

async function addAlertRule(body: any) {
  try {
    const ruleData = AlertRuleSchema.parse(body);

    const rule = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...ruleData,
      enabled: true,
      createdAt: new Date()
    };

    monitoringService.addAlertRule(rule);

    return NextResponse.json({
      success: true,
      rule
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add alert rule' }, { status: 500 });
  }
}

async function resolveAlert(body: any) {
  try {
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const success = monitoringService.resolveAlert(alertId);

    return NextResponse.json({
      success,
      alertId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 });
  }
}

async function deleteSchedule(body: any) {
  try {
    const { scheduleId } = body;

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const success = await schedulerService.deleteSchedule(scheduleId);

    return NextResponse.json({
      success,
      scheduleId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}

async function deletePriorityRule(body: any) {
  try {
    const { ruleId } = body;

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const success = priorityProcessor.removePriorityRule(ruleId);

    return NextResponse.json({
      success,
      ruleId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete priority rule' }, { status: 500 });
  }
}

async function deleteRoutingRule(body: any) {
  try {
    const { ruleId } = body;

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const success = priorityProcessor.removeRoutingRule(ruleId);

    return NextResponse.json({
      success,
      ruleId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete routing rule' }, { status: 500 });
  }
}

async function deleteFilterRule(body: any) {
  try {
    const { ruleId } = body;

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const success = priorityProcessor.removeFilterRule(ruleId);

    return NextResponse.json({
      success,
      ruleId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete filter rule' }, { status: 500 });
  }
}

async function deleteAlertRule(body: any) {
  try {
    const { ruleId } = body;

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const success = monitoringService.removeAlertRule(ruleId);

    return NextResponse.json({
      success,
      ruleId
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete alert rule' }, { status: 500 });
  }
}

async function purgeQueue(body: any) {
  try {
    const { queueName } = body;

    if (!queueName) {
      return NextResponse.json({ error: 'Queue name is required' }, { status: 400 });
    }

    await queueManager.purgeQueue(queueName);

    return NextResponse.json({
      success: true,
      queueName
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to purge queue' }, { status: 500 });
  }
}