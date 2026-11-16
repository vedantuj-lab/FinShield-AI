import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'),
  status: text('status').notNull().default('active'),
  preferredLanguage: text('preferred_language').notNull().default('en'),
  retentionDays: integer('retention_days').notNull().default(90),
  redactSensitive: boolean('redact_sensitive').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  resetTokenHash: text('reset_token_hash'),
  resetTokenExpiresAt: timestamp('reset_token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const investigations = pgTable(
  'investigations',
  {
    id: serial('id').primaryKey(),
    investigationCode: text('investigation_code').notNull().unique(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    suspectedCategory: text('suspected_category').notNull().default('Pending Analysis'),
    riskLevel: text('risk_level').notNull().default('LOW'),
    riskScore: integer('risk_score').notNull().default(0),
    status: text('status').notNull().default('active'),
    summary: text('summary').notNull().default(''),
    explanation: text('explanation').notNull().default(''),
    recommendedActions: jsonb('recommended_actions').$type<string[]>().notNull().default([]),
    isSyntheticDemo: boolean('is_synthetic_demo').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_investigations_user_id').on(table.userId),
    index('idx_investigations_risk_level').on(table.riskLevel),
  ]
);

export const evidence = pgTable(
  'evidence',
  {
    id: serial('id').primaryKey(),
    investigationId: integer('investigation_id')
      .references(() => investigations.id, { onDelete: 'cascade' })
      .notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    evidenceType: text('evidence_type').notNull(),
    title: text('title').notNull(),
    fileReference: text('file_reference'),
    mimeType: text('mime_type'),
    rawInput: text('raw_input').notNull().default(''),
    extractedText: text('extracted_text').notNull().default(''),
    analysisSummary: text('analysis_summary').notNull().default(''),
    detectedIndicators: jsonb('detected_indicators')
      .$type<
        Array<{
          type: string;
          severity: string;
          evidence: string;
          explanation: string;
        }>
      >()
      .notNull()
      .default([]),
    extractedDetails: jsonb('extracted_details')
      .$type<{
        urls?: string[];
        amounts?: string[];
        upiIds?: string[];
        phoneNumbers?: string[];
        claimedEntity?: string;
        paymentInstructions?: string;
        domainCharacteristics?: string[];
      }>()
      .notNull()
      .default({}),
    potentialRisks: jsonb('potential_risks').$type<string[]>().notNull().default([]),
    analysisStatus: text('analysis_status').notNull().default('pending'),
    eventTimestamp: text('event_timestamp'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_evidence_investigation_id').on(table.investigationId)]
);

export const riskIndicators = pgTable(
  'risk_indicators',
  {
    id: serial('id').primaryKey(),
    investigationId: integer('investigation_id')
      .references(() => investigations.id, { onDelete: 'cascade' })
      .notNull(),
    evidenceId: integer('evidence_id').references(() => evidence.id, { onDelete: 'set null' }),
    indicatorType: text('indicator_type').notNull(),
    category: text('category').notNull().default('manipulation'),
    severity: text('severity').notNull().default('low'),
    weight: integer('weight').notNull().default(0),
    detected: boolean('detected').notNull().default(false),
    supportingEvidence: text('supporting_evidence').notNull().default(''),
    explanation: text('explanation').notNull().default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_risk_indicators_investigation_id').on(table.investigationId)]
);

export const evidenceRelationships = pgTable(
  'evidence_relationships',
  {
    id: serial('id').primaryKey(),
    investigationId: integer('investigation_id')
      .references(() => investigations.id, { onDelete: 'cascade' })
      .notNull(),
    sourceEvidenceId: integer('source_evidence_id').references(() => evidence.id, {
      onDelete: 'cascade',
    }),
    targetEvidenceId: integer('target_evidence_id').references(() => evidence.id, {
      onDelete: 'cascade',
    }),
    relationshipType: text('relationship_type').notNull(),
    eventTime: text('event_time').notNull().default(''),
    indicatorLabel: text('indicator_label').notNull().default(''),
    explanation: text('explanation').notNull().default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_evidence_relationships_investigation_id').on(table.investigationId)]
);

export const paymentSafetyChecks = pgTable(
  'payment_safety_checks',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    amount: text('amount').notNull(),
    purpose: text('purpose').notNull(),
    recipientFamiliarity: text('recipient_familiarity').notNull(),
    contactMethod: text('contact_method').notNull(),
    requestedByCaller: boolean('requested_by_caller').notNull().default(false),
    urgencyInvolved: boolean('urgency_involved').notNull().default(false),
    kycRelated: boolean('kyc_related').notNull().default(false),
    confidentialInfoAsked: boolean('confidential_info_asked').notNull().default(false),
    independentlyVerified: boolean('independently_verified').notNull().default(false),
    riskLevel: text('risk_level').notNull(),
    riskScore: integer('risk_score').notNull(),
    reasons: jsonb('reasons').$type<string[]>().notNull().default([]),
    recommendedAction: text('recommended_action').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_payment_checks_user_id').on(table.userId)]
);

export const rescueCases = pgTable(
  'rescue_cases',
  {
    id: serial('id').primaryKey(),
    rescueCode: text('rescue_code').notNull().unique(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    incidentDate: text('incident_date').notNull(),
    incidentTime: text('incident_time').notNull(),
    amountInvolved: text('amount_involved').notNull(),
    paymentMethod: text('payment_method').notNull(),
    transactionReference: text('transaction_reference').notNull(),
    bankProvider: text('bank_provider').notNull(),
    suspectedCategory: text('suspected_category').notNull(),
    description: text('description').notNull(),
    actionsTaken: jsonb('actions_taken').$type<string[]>().notNull().default([]),
    pendingActions: jsonb('pending_actions').$type<string[]>().notNull().default([]),
    evidenceItems: jsonb('evidence_items')
      .$type<
        Array<{
          id: string;
          type: string;
          title: string;
          summary: string;
          timestamp: string;
          fileReference?: string;
        }>
      >()
      .notNull()
      .default([]),
    timelineEvents: jsonb('timeline_events')
      .$type<
        Array<{
          time: string;
          title: string;
          detail: string;
        }>
      >()
      .notNull()
      .default([]),
    reportReference: text('report_reference').notNull(),
    status: text('status').notNull().default('open'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_rescue_cases_user_id').on(table.userId)]
);

export const trustedContacts = pgTable(
  'trusted_contacts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    contactName: text('contact_name').notNull(),
    relationship: text('relationship').notNull().default('Family'),
    contactDetails: text('contact_details').notNull(),
    consentStatus: text('consent_status').notNull().default('granted'),
    canReceiveRedactedAlerts: boolean('can_receive_redacted_alerts').notNull().default(true),
    lastSharedAt: timestamp('last_shared_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_trusted_contacts_user_id').on(table.userId)]
);

export const sharedWarnings = pgTable(
  'shared_warnings',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    contactId: integer('contact_id')
      .references(() => trustedContacts.id, { onDelete: 'cascade' })
      .notNull(),
    investigationId: integer('investigation_id').references(() => investigations.id, {
      onDelete: 'set null',
    }),
    redactedSummary: text('redacted_summary').notNull(),
    riskLevel: text('risk_level').notNull(),
    sharedAt: timestamp('shared_at').defaultNow().notNull(),
  },
  (table) => [index('idx_shared_warnings_user_id').on(table.userId)]
);

export const aiFeedback = pgTable(
  'ai_feedback',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    investigationId: integer('investigation_id').references(() => investigations.id, {
      onDelete: 'set null',
    }),
    evidenceId: integer('evidence_id').references(() => evidence.id, {
      onDelete: 'set null',
    }),
    moduleType: text('module_type').notNull(),
    userReason: text('user_reason').notNull(),
    expectedOutcome: text('expected_outcome').notNull().default(''),
    reportedContentExcerpt: text('reported_content_excerpt').notNull().default(''),
    aiPredictedRisk: text('ai_predicted_risk').notNull().default(''),
    status: text('status').notNull().default('open'),
    adminNotes: text('admin_notes').notNull().default(''),
    reviewedByAdminId: integer('reviewed_by_admin_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_ai_feedback_user_id').on(table.userId),
    index('idx_ai_feedback_status').on(table.status),
  ]
);

export const scamCategories = pgTable('scam_categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  severityDefault: text('severity_default').notNull().default('HIGH'),
  isActive: boolean('is_active').notNull().default(true),
  ruleWeightsJson: jsonb('rule_weights_json')
    .$type<{
      indicatorKey?: string;
      weight?: number;
      keywords?: string[];
      guidance?: string;
    }>()
    .notNull()
    .default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const educationalSafetyContent = pgTable('educational_safety_content', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  language: text('language').notNull().default('en'),
  summary: text('summary').notNull(),
  actionChecklist: jsonb('action_checklist').$type<string[]>().notNull().default([]),
  isPublished: boolean('is_published').notNull().default(true),
  updatedByAdminId: integer('updated_by_admin_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const supportRequests = pgTable(
  'support_requests',
  {
    id: serial('id').primaryKey(),
    referenceCode: text('reference_code').notNull().unique(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    topic: text('topic').notNull(),
    message: text('message').notNull(),
    status: text('status').notNull().default('open'),
    adminReply: text('admin_reply').notNull().default(''),
    assignedAdminId: integer('assigned_admin_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_support_requests_status').on(table.status),
    index('idx_support_requests_user_id').on(table.userId),
  ]
);

export const aiActivityLogs = pgTable(
  'ai_activity_logs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    module: text('module').notNull(),
    modelName: text('model_name').notNull(),
    status: text('status').notNull(),
    latencyMs: integer('latency_ms').notNull().default(0),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_ai_activity_logs_created_at').on(table.createdAt)]
);

export const adminAuditLogs = pgTable(
  'admin_audit_logs',
  {
    id: serial('id').primaryKey(),
    adminUserId: integer('admin_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull().default(''),
    details: jsonb('details').$type<Record<string, any>>().notNull().default({}),
    ipAddress: text('ip_address').notNull().default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_admin_audit_logs_created_at').on(table.createdAt)]
);

export const usersRelations = relations(users, ({ many }) => ({
  investigations: many(investigations),
  paymentSafetyChecks: many(paymentSafetyChecks),
  rescueCases: many(rescueCases),
  trustedContacts: many(trustedContacts),
  aiFeedback: many(aiFeedback),
  supportRequests: many(supportRequests),
}));

export const investigationsRelations = relations(investigations, ({ one, many }) => ({
  user: one(users, {
    fields: [investigations.userId],
    references: [users.id],
  }),
  evidenceItems: many(evidence),
  riskIndicators: many(riskIndicators),
  relationships: many(evidenceRelationships),
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  investigation: one(investigations, {
    fields: [evidence.investigationId],
    references: [investigations.id],
  }),
}));

export const riskIndicatorsRelations = relations(riskIndicators, ({ one }) => ({
  investigation: one(investigations, {
    fields: [riskIndicators.investigationId],
    references: [investigations.id],
  }),
}));

export const evidenceRelationshipsRelations = relations(evidenceRelationships, ({ one }) => ({
  investigation: one(investigations, {
    fields: [evidenceRelationships.investigationId],
    references: [investigations.id],
  }),
}));
