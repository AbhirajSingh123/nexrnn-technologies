/**
 * Admin -> user mail compose links.
 * Mail admin ke apne mail client se jaati hai (mailto), user ki id par,
 * subject + body me saare details pre-filled.
 */

function enc(s) {
  return encodeURIComponent(s || '');
}

/**
 * Course/Workshop enrollment mail
 * lead: { name, email, batchId, referenceId, itemTitle, type }
 */
export function buildEnrollmentMailto(lead) {
  const title = lead.itemTitle || 'Program';
  const typeName = lead.type === 'workshop' ? 'Workshop' : 'Course';
  const subject = `NexRNN Technologies - ${title}`;
  const body = [
    `Name: ${lead.name || ''}`,
    `Email: ${lead.email || ''}`,
    `${typeName} Name: ${title}`,
    `Batch ID: ${lead.batchId || '-'}`,
    `Reference ID: ${lead.referenceId || '-'}`,
    '',
    `Hello ${lead.name || 'there'},`,
    '',
    `Thank you for enrolling in the ${typeName.toLowerCase()} "${title}" with NexRNN Technologies.`,
    'Please use the details above for any communication regarding your enrollment.',
    '',
    'Warm regards,',
    'NexRNN Technologies',
    'https://www.nexrnntechnologies.in/',
  ].join('\n');

  return `mailto:${enc(lead.email)}?subject=${enc(subject)}&body=${enc(body)}`;
}

/**
 * Career application mail
 * app: { fullName, email, applicationId, openingCode, openingTitle, domain, typeLabel }
 */
export function buildApplicationMailto(app) {
  const subject = `NexRNN Technologies - ${app.openingTitle || 'Application'}`;
  const body = [
    `Name: ${app.fullName || ''}`,
    `Email: ${app.email || ''}`,
    `Application ID: ${app.applicationId || '-'}`,
    `Opening ID: ${app.openingCode || '-'}`,
    `Opening Title: ${app.openingTitle || '-'}`,
    `Domain: ${app.domain || '-'}`,
    `Type: ${app.typeLabel || '-'}`,
    '',
    `Hello ${app.fullName || 'there'},`,
    '',
    'Thank you for applying to NexRNN Technologies.',
    'Please use the details above for any communication regarding your application.',
    '',
    'Warm regards,',
    'NexRNN Technologies',
    'https://www.nexrnntechnologies.in/',
  ].join('\n');

  return `mailto:${enc(app.email)}?subject=${enc(subject)}&body=${enc(body)}`;
}
