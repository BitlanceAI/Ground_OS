import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting database lead & demo data cleanup...');

  // Delete Meeting child records
  await prisma.meetingInsight.deleteMany({});
  console.log('✅ Cleared meeting insights');

  await prisma.transcript.deleteMany({});
  console.log('✅ Cleared transcripts');

  await prisma.recording.deleteMany({});
  console.log('✅ Cleared recordings');

  // Delete Meetings
  await prisma.meeting.deleteMany({});
  console.log('✅ Cleared meetings');

  // Delete Visit child records
  await prisma.visitEvent.deleteMany({});
  console.log('✅ Cleared visit events');

  // Delete Visits
  await prisma.visit.deleteMany({});
  console.log('✅ Cleared visits');

  // Delete Lead child records
  await prisma.leadScoreHistory.deleteMany({});
  console.log('✅ Cleared lead score history');

  // Delete Leads
  await prisma.lead.deleteMany({});
  console.log('✅ Cleared leads');

  // Delete Customer child records
  await prisma.timelineEvent.deleteMany({});
  console.log('✅ Cleared timeline events');

  await prisma.followUp.deleteMany({});
  console.log('✅ Cleared follow ups');

  await prisma.voiceCall.deleteMany({});
  console.log('✅ Cleared voice calls');

  await prisma.requirement.deleteMany({});
  console.log('✅ Cleared requirements');

  await prisma.creativeRequest.deleteMany({});
  console.log('✅ Cleared creative requests');

  await prisma.message.deleteMany({});
  console.log('✅ Cleared messages');

  await prisma.conversation.deleteMany({});
  console.log('✅ Cleared conversations');

  // Delete Customers
  await prisma.customer.deleteMany({});
  console.log('✅ Cleared customers');

  console.log('\n🎉 Successfully cleared all demo leads, visits, meetings, and customers from PostgreSQL database.');
  console.log('🔒 Preserved all User accounts and Agent credentials.');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
