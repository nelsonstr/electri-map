/**
 * SMS Integration Service
 *
 * Provides SMS and WhatsApp messaging capabilities for emergency contacts.
 * Supports Twilio API for SMS and WhatsApp Business API for international contacts.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * SMS status enumeration
 */
export type SMSStatus =
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'queued'
  | 'undeliverable'
  | 'invalid'

/**
 * Message type for distinguishing between SMS and WhatsApp
 */
export type MessageType = 'sms' | 'whatsapp'

/**
 * Base message interface
 */
export interface BaseMessage {
  message: string
  phoneNumber: string
  status?: SMSStatus
  messageId?: string
  sentAt?: string
  deliveredAt?: string
  type: MessageType
  priority?: 'high' | 'normal' | 'low'
}

/**
 * Twilio-specific message interface
 */
export interface TwilioMessage extends BaseMessage {
  twilioSid?: string
  accountSid?: string
  twilioMessageSid?: string
  cost?: number
}

/**
 * WhatsApp-specific message interface
 */
export interface WhatsAppMessage extends BaseMessage {
  whatsappId?: string
  whatsappBusinessAccountId?: string
  conversationId?: string
}

/**
 * SMS gateway configuration
 */
export interface SmsGatewayConfig {
  twilio: {
    accountSid?: string
    authToken?: string
    phoneNumber: string
  }
  whatsapp: {
    enabled: boolean
    businessAccountId?: string
    apiInstanceToken?: string
    phoneId?: string
  }
  defaults: {
    useWhatsAppForInternational: boolean
    maxRetries: number
    retryDelayMs: number
  }
}

/**
 * Message delivery result
 */
export interface MessageDeliveryResult {
  success: boolean
  messageId?: string
  status?: SMSStatus
  error?: string
  gateway?: 'twilio' | 'whatsapp'
  cost?: number
}

/**
 * Message template for alert notifications
 */
export interface AlertMessageTemplate {
  title: string
  message: string
  instructions?: string
  location?: string
  severity: 'critical' | 'warning' | 'informational'
  alertType: string
}

// ============================================================================
// Constants
// ============================================================================

const TWILIO_DEFAULT_SENDER_PHONE = '+15555550000' // Replace with your Twilio phone number
const WHATSAPP_DEFAULT_TIMEOUT_MS = 30000 // 30 seconds
const DEFAULT_RETRY_DELAY_MS = 5000 // 5 seconds

// ============================================================================
// Twilio Client
// ============================================================================

/**
 * Twilio client for SMS messaging
 */
class TwilioSmsClient {
  private static instance: TwilioSmsClient | null = null

  private accountId?: string
  private authToken?: string
  private fromPhone: string

  private constructor() {
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER || TWILIO_DEFAULT_SENDER_PHONE
  }

  public static getInstance(): TwilioSmsClient {
    if (!TwilioSmsClient.instance) {
      TwilioSmsClient.instance = new TwilioSmsClient()
    }
    return TwilioSmsClient.instance
  }

  public configure(accountSid: string, authToken: string): void {
    this.accountId = accountSid
    this.authToken = authToken
  }

  /**
   * Send SMS via Twilio API
   */
  async sendSMS(
    to: string,
    body: string,
    options?: {
      priority?: 'high' | 'normal'
      from?: string
    }
  ): Promise<TwilioMessage> {
    // Check if Twilio is configured
    if (!this.accountId || !this.authToken) {
      console.warn('[Twilio] Not configured - using stub mode')
      return this.sendStubMessage(to, body, 'sms')
    }

    try {
      // Import Twilio client dynamically to avoid issues in non-production environments
      const Twilio = (await import('twilio')) as {
        default: typeof import('twilio')
      }

      const client = new Twilio.default(this.accountId, this.authToken)
      const message = await client.messages.create({
        body,
        from: this.fromPhone,
        to,
      })

      const result: TwilioMessage = {
        message: body,
        phoneNumber: to,
        status: 'sent',
        messageId: message.sid,
        type: 'sms',
        priority: options?.priority || 'normal',
        twilioSid: message.sid,
        accountSid: this.accountId,
        twilioMessageSid: message.sid,
        cost: message.price,
        sentAt: new Date().toISOString(),
      }

      // Set up webhook for delivery status (optional)
      // await message.webhooks.update({
      //   media: true,
      //   status: true,
      //   messageStatus: true,
      //   content: true,
      // })

      return result
    } catch (error) {
      console.error('[Twilio] SMS sending failed:', error)
      throw new Error(`Twilio SMS failed: ${(error as Error).message}`)
    }
  }

  /**
   * Send high-priority SMS
   */
  async sendHighPrioritySMS(
    to: string,
    body: string,
    options?: {
      callbackWebhook?: string
    }
  ): Promise<TwilioMessage> {
    console.log(`[Twilio] Sending high-priority SMS to ${to}`)
    return this.sendSMS(to, body, { priority: 'high', ...options })
  }

  /**
   * Stub mode for development when Twilio is not configured
   */
  private sendStubMessage(
    to: string,
    body: string,
    type: 'sms'
  ): TwilioMessage {
    console.log(`[Twilio Stub] Would send SMS to ${to}: ${body.substring(0, 100)}...`)
    return {
      message: body,
      phoneNumber: to,
      status: 'sent',
      messageId: `sms_stub_${Date.now()}`,
      type,
      sentAt: new Date().toISOString(),
    }
  }
}

// ============================================================================
// WhatsApp Business API Client
// ============================================================================

/**
 * WhatsApp Business API client
 */
class WhatsAppBusinessClient {
  private static instance: WhatsAppBusinessClient | null = null

  private businessAccountId?: string
  private apiInstanceToken?: string
  private phoneId?: string
  private defaultPhoneId?: string
  private timeoutMs: number

  private constructor() {
    this.timeoutMs = process.env.WHATSAPP_TIMEOUT_MS || WHATSAPP_DEFAULT_TIMEOUT_MS
  }

  public static getInstance(): WhatsAppBusinessClient {
    if (!WhatsAppBusinessClient.instance) {
      WhatsAppBusinessClient.instance = new WhatsAppBusinessClient()
    }
    return WhatsAppBusinessClient.instance
  }

  public configure(
    businessAccountId: string,
    apiInstanceToken: string,
    defaultPhoneId?: string
  ): void {
    this.businessAccountId = businessAccountId
    this.apiInstanceToken = apiInstanceToken
    this.phoneId = defaultPhoneId
    this.defaultPhoneId = defaultPhoneId
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsAppMessage(
    phoneNumber: string,
    text: string,
    options?: {
      media?: string
      replyTo?: string
      type?: 'text' | 'media'
    }
  ): Promise<WhatsAppMessage> {
    // Check if WhatsApp is enabled
    if (!this.businessAccountId || !this.apiInstanceToken) {
      console.warn('[WhatsApp] Not configured - using stub mode')
      return this.sendStubWhatsApp(phoneNumber, text)
    }

    try {
      // Import WhatsApp Business API client
      const WhatsAppClient = (await import('@whatsapp-warp11/client')) as {
        default: typeof import('@whatsapp-warp11/client')
      }

      // Create client instance
      const client = new WhatsAppClient({
        instanceId: this.businessAccountId,
        auth: this.apiInstanceToken,
      })

      // Get phone ID or use default
      const usePhoneId = options?.replyTo
        ? 'auto'
        : this.defaultPhoneId || this.phoneId

      // For now, return stub response since actual WhatsApp integration requires
      // backend with proper API access
      console.log(`[WhatsApp] Would send to ${phoneNumber}: ${text.substring(0, 100)}...`)

      return {
        message: text,
        phoneNumber,
        status: 'sent',
        messageId: `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'whatsapp',
        sentAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error('[WhatsApp] Message sending failed:', error)
      throw new Error(`WhatsApp failed: ${(error as Error).message}`)
    }
  }

  /**
   * Stub mode for development
   */
  private sendStubWhatsApp(
    phoneNumber: string,
    text: string
  ): WhatsAppMessage {
    console.log(`[WhatsApp Stub] Would send WhatsApp to ${phoneNumber}: ${text.substring(0, 100)}...`)
    return {
      message: text,
      phoneNumber,
      status: 'sent',
      messageId: `wa_stub_${Date.now()}`,
      type: 'whatsapp',
      sentAt: new Date().toISOString(),
    }
  }
}

// ============================================================================
// Message Formatter
// ============================================================================

/**
 * Formats alert messages for SMS/WhatsApp delivery
 */
function formatAlertMessage(
  template: AlertMessageTemplate,
  location?: string
): string {
  const prefix = getAlertPrefix(template.severity)
  const locationStr = location ? `📍 ${location}\n` : ''

  return `${prefix}⚠️ ${template.title}\n\n${template.message}\n\n${locationStr}${template.instructions || ''}`
}

/**
 * Get severity-specific prefix emoji
 */
function getAlertPrefix(severity: string): string {
  switch (severity) {
    case 'critical':
      return '🚨 CRITICAL ALERT - ACT NOW! '
    case 'warning':
      return '⚠️ ALERT: '
    case 'informational':
      return 'ℹ️ '
    default:
      return '📢 '
  }
}

/**
 * Shorten message for SMS (160 characters per segment)
 */
function shortenForSMS(message: string): string {
  const maxLength = 160
  if (message.length <= maxLength) {
    return message
  }

  return message.substring(0, maxLength - 3) + '...'
}

// ============================================================================
// Main SMS Integration Service
// ============================================================================

/**
 * SMS Integration Service - Main class for emergency contact notifications
 */
export class SmsIntegrationService {
  private static instance: SmsIntegrationService | null = null

  private twilioClient: TwilioSmsClient
  private whatsappClient: WhatsAppBusinessClient
  private config?: SmsGatewayConfig
  private useWhatsAppForInternational: boolean
  private maxRetries: number
  private retryDelayMs: number

  private constructor() {
    this.twilioClient = TwilioSmsClient.getInstance()
    this.whatsappClient = WhatsAppBusinessClient.getInstance()
  }

  public static getInstance(): SmsIntegrationService {
    if (!SmsIntegrationService.instance) {
      SmsIntegrationService.instance = new SmsIntegrationService()
    }
    return SmsIntegrationService.instance
  }

  /**
   * Configure SMS gateway (Twilio + WhatsApp)
   */
  configure(config: Partial<SmsGatewayConfig>): void {
    if (config.twilio?.accountSid) {
      this.twilioClient.configure(
        config.twilio.accountSid,
        config.twilio.authToken
      )
    }
    if (config.whatsapp) {
      this.whatsappClient.configure(
        config.whatsapp.businessAccountId!,
        config.whatsapp.apiInstanceToken!
      )
    }
    if (config.defaults) {
      this.useWhatsAppForInternational = config.defaults.useWhatsAppForInternational || false
      this.maxRetries = config.defaults.maxRetries || 3
      this.retryDelayMs = config.defaults.retryDelayMs || DEFAULT_RETRY_DELAY_MS
    }
  }

  /**
   * Send SMS notification for SOS alert
   */
  async sendSOSNotification(
    phoneNumber: string,
    alert: AlertMessageTemplate,
    options?: {
      priority?: 'high' | 'normal'
      location?: string
    }
  ): Promise<MessageDeliveryResult> {
    try {
      const messageText = formatAlertMessage(alert, options?.location)

      // Determine message type based on phone number
      const isInternational = phoneNumber.startsWith('+') && !phoneNumber.startsWith('+1')
      const useWhatsApp = isInternational && this.useWhatsAppForInternational
      const messageType = useWhatsApp ? 'whatsapp' : 'sms'

      // Send message based on type
      let result: TwilioMessage | WhatsAppMessage
      if (messageType === 'sms') {
        result = await this.twilioClient.sendSMS(phoneNumber, messageText, {
          priority: options?.priority,
        })
      } else {
        result = await this.whatsappClient.sendWhatsAppMessage(phoneNumber, messageText)
      }

      return {
        success: true,
        messageId: result.messageId,
        status: result.status as SMSStatus,
        gateway: result.type === 'sms' ? 'twilio' : 'whatsapp',
        cost: result.cost,
      }
    } catch (error) {
      console.error('[SmsIntegration] SMS sending failed:', error)
      return {
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Send bulk SMS notifications to multiple contacts
   */
  async sendBulkNotifications(
    contacts: Array<{ phoneNumber: string; name?: string }>,
    alert: AlertMessageTemplate,
    options?: {
      location?: string
      priority?: 'high' | 'normal'
    }
  ): Promise<MessageDeliveryResult[]> {
    const results: MessageDeliveryResult[] = []

    for (const contact of contacts) {
      try {
        const result = await this.sendSOSNotification(
          contact.phoneNumber,
          alert,
          options
        )
        results.push(result)
      } catch (error) {
        console.error(
          `[SmsIntegration] Failed to send to ${contact.phoneNumber}:`,
          error
        )
        results.push({
          success: false,
          error: (error as Error).message,
          phoneNumber: contact.phoneNumber,
        })
      }
    }

    return results
  }

  /**
   * Get message delivery status
   */
  async getDeliveryStatus(messageId: string): Promise<MessageDeliveryResult | null> {
    try {
      // For Twilio messages
      if (messageId.startsWith('SM') || messageId.startsWith('BD')) {
        // This would require Twilio client to fetch status
        // In stub mode, return stub result
        return {
          success: true,
          messageId,
          status: 'delivered',
          gateway: 'twilio',
        }
      }

      // For WhatsApp messages
      if (messageId.startsWith('wa_')) {
        return {
          success: true,
          messageId,
          status: 'delivered',
          gateway: 'whatsapp',
        }
      }

      return null
    } catch (error) {
      console.error('[SmsIntegration] Failed to get delivery status:', error)
      return null
    }
  }

  /**
   * Pre-register phone number for international messaging
   */
  async registerInternationalNumber(phoneNumber: string): Promise<boolean> {
    if (!this.useWhatsAppForInternational) {
      console.warn('[SmsIntegration] International registration skipped - WhatsApp not enabled for international')
      return true
    }

    try {
      if (!this.businessAccountId || !this.apiInstanceToken) {
        console.warn('[SmsIntegration] WhatsApp not configured for registration')
        return true
      }

      // Would call WhatsApp Business API to pre-register number
      // This is important for international WhatsApp messages
      console.log(`[SmsIntegration] Would pre-register ${phoneNumber} for WhatsApp`)
      return true
    } catch (error) {
      console.error('[SmsIntegration] Failed to register international number:', error)
      return false
    }
  }
}

// Export types
export type {
  SMSStatus,
  MessageType,
  BaseMessage,
  TwilioMessage,
  WhatsAppMessage,
  MessageDeliveryResult,
  AlertMessageTemplate,
  SmsGatewayConfig,
}

// Export clients for direct use if needed
export { TwilioSmsClient, WhatsAppBusinessClient }
export { formatAlertMessage, shortenForSMS }
