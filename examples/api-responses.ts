import { template } from '../src';

console.log('=== API Response Formatting Examples ===\n');

// Example 1: Success Response
console.log('1. Success Response:');

const successTemplate = template<{
  resource: string;
  id: string;
  action: string;
}>(
  '{{"status": "success", "message": "{resource} {id} {action} successfully"}}'
);

console.log(successTemplate({
  resource: "User",
  id: "12345",
  action: "created",
}));

// Example 2: Error Response
console.log('\n2. Error Response:');

const errorTemplate = template<{
  code: number;
  message: string;
  field?: string;
}>(
  '{{"status": "error", "code": {code}, "message": "{message}"{field}}}'
);

console.log(errorTemplate({
  code: 400,
  message: "Invalid email format",
  field: ', "field": "email"',
}));

console.log(errorTemplate({
  code: 404,
  message: "Resource not found",
}));

// Example 3: Paginated List Response
console.log('\n3. Paginated Response Metadata:');

const paginationTemplate = template<{
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>(
  'Showing page {page} of {totalPages} ({pageSize|plural:item,items} per page, {total} total)'
);

console.log(paginationTemplate({
  total: 156,
  page: 1,
  pageSize: 20,
  totalPages: 8,
}));

console.log(paginationTemplate({
  total: 1,
  page: 1,
  pageSize: 20,
  totalPages: 1,
}));

// Example 4: Notification Message
console.log('\n4. Notification Messages:');

const notificationTemplate = template<{
  type: string;
  count: number;
  timestamp: Date;
}>(
  '[{type|upper|pad:10}] {count|plural:new notification,new notifications} at {timestamp|date:short}',
  { locale: 'en-US' }
);

console.log(notificationTemplate({
  type: "info",
  count: 1,
  timestamp: new Date(),
}));

console.log(notificationTemplate({
  type: "warning",
  count: 5,
  timestamp: new Date(),
}));

// Example 5: Activity Log
console.log('\n5. Activity Log Messages:');

const activityTemplate = template<{
  user: { name: string };
  action: string;
  resource: { type: string; id: string };
  timestamp: Date;
}>(
  '{user.name} {action} {resource.type} #{resource.id} on {timestamp|date:short}',
  { locale: 'en-US' }
);

console.log(activityTemplate({
  user: { name: "Alice" },
  action: "updated",
  resource: { type: "Post", id: "789" },
  timestamp: new Date(),
}));

console.log(activityTemplate({
  user: { name: "Bob" },
  action: "deleted",
  resource: { type: "Comment", id: "456" },
  timestamp: new Date(),
}));

// Example 6: Rate Limit Message
console.log('\n6. Rate Limit Messages:');

const rateLimitTemplate = template<{
  limit: number;
  remaining: number;
  resetTime: Date;
}>(
  'Rate limit: {remaining}/{limit} requests remaining (resets at {resetTime|date:short})',
  { locale: 'en-US' }
);

console.log(rateLimitTemplate({
  limit: 100,
  remaining: 42,
  resetTime: new Date(Date.now() + 3600000), // 1 hour from now
}));

// Example 7: Webhook Event Message
console.log('\n7. Webhook Event Messages:');

const webhookTemplate = template<{
  event: string;
  source: { service: string; id: string };
  deliveredAt: Date;
}>(
  'Webhook event: {event|upper} from {source.service} (ID: {source.id}) delivered at {deliveredAt|date:medium}',
  { locale: 'en-US' }
);

console.log(webhookTemplate({
  event: "user.created",
  source: { service: "AuthService", id: "webhook-001" },
  deliveredAt: new Date(),
}));

// Example 8: Status Message with Metrics
console.log('\n8. System Status with Metrics:');

const statusTemplate = template<{
  service: string;
  uptime: number;
  requestCount: number;
  errorRate: number;
}>(
  '{service}: {uptime|number}s uptime, {requestCount|number} requests, {errorRate|percent} error rate',
  { locale: 'en-US' }
);

console.log(statusTemplate({
  service: "API Gateway",
  uptime: 86400,
  requestCount: 1500000,
  errorRate: 0.025,
}));

// Example 9: Search Results Summary
console.log('\n9. Search Results Summary:');

const searchTemplate = template<{
  query: string;
  results: number;
  time: number;
}>(
  'Found {results|number} {results|plural:result,results} for "{query}" in {time}ms'
);

console.log(searchTemplate({
  query: "typescript templates",
  results: 42,
  time: 125,
}));

console.log(searchTemplate({
  query: "rare search term",
  results: 1,
  time: 89,
}));

// Example 10: File Upload Progress
console.log('\n10. File Upload Status:');

const uploadTemplate = template<{
  fileName: string;
  progress: number;
  bytesUploaded: number;
  totalBytes: number;
}>(
  'Uploading {fileName}: {progress|percent} complete ({bytesUploaded|number}/{totalBytes|number} bytes)',
  { locale: 'en-US' }
);

console.log(uploadTemplate({
  fileName: "document.pdf",
  progress: 0.65,
  bytesUploaded: 6500000,
  totalBytes: 10000000,
}));
