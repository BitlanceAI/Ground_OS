import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Bitlance Ground OS users...');

  // ── Organization ──────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'bitlance-tech-hub' },
    update: {},
    create: {
      name: 'Bitlance Tech Hub',
      slug: 'bitlance-tech-hub',
      settings: {
        primaryColor: '#6366f1',
        voiceAIEnabled: true,
        whatsappEnabled: true,
        creativeEnabled: true,
        inactivityThresholdMinutes: 5,
      },
    },
  });
  console.log(`✅ Organization: ${org.name}`);

  // ── Users ─────────────────────────────────────────────────
  const adminPwHash = await bcrypt.hash('admin@123', 12);
  const agentPwHash = await bcrypt.hash('agent@123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'bitlanceai@gmail.com' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'bitlanceai@gmail.com',
      passwordHash: adminPwHash,
      firstName: 'Admin',
      lastName: 'Bitlance',
      role: 'CEO',
    },
  });

  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@gmail.com' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'agent@gmail.com',
      passwordHash: agentPwHash,
      firstName: 'Agent',
      lastName: 'User',
      role: 'AGENT',
    },
  });

  console.log('✅ Users: Admin, Agent');

  // ── Agents ────────────────────────────────────────────────
  const agentProfile = await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      organizationId: org.id,
      userId: agentUser.id,
      employeeCode: 'AG001',
      phone: '+91 98765 43210',
      status: 'ONLINE',
      currentLatitude: 19.076,
      currentLongitude: 72.8777,
      territory: 'Andheri West',
    },
  });
  console.log('✅ Agent Profile Created');

  console.log('\n🎉 Bitlance Ground OS seed complete!');
  console.log('\n📋 Credentials:');
  console.log('   Admin: bitlanceai@gmail.com / admin@123');
  console.log('   Agent: agent@gmail.com / agent@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
