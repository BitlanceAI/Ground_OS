import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Bitlance Ground OS users & field agents...');

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
  const nileshPwHash = await bcrypt.hash('nilesh@123', 12);
  const agentPwHash = await bcrypt.hash('agent@123', 12);

  // CEO / Admin
  await prisma.user.upsert({
    where: { email: 'bitlanceai@gmail.com' },
    update: {
      passwordHash: adminPwHash,
    },
    create: {
      organizationId: org.id,
      email: 'bitlanceai@gmail.com',
      passwordHash: adminPwHash,
      firstName: 'Admin',
      lastName: 'Bitlance',
      role: 'CEO',
    },
  });

  // Agent Nilesh
  const nileshUser = await prisma.user.upsert({
    where: { email: 'agentnilesh@gmail.com' },
    update: {
      passwordHash: nileshPwHash,
      firstName: 'Nilesh',
      lastName: 'Somnawane',
    },
    create: {
      organizationId: org.id,
      email: 'agentnilesh@gmail.com',
      passwordHash: nileshPwHash,
      firstName: 'Nilesh',
      lastName: 'Somnawane',
      role: 'AGENT',
    },
  });

  // Agent Nilesh Profile
  await prisma.agent.upsert({
    where: { userId: nileshUser.id },
    update: {
      employeeCode: 'AG001',
      phone: '+91 74981 62774',
      territory: 'Pune',
      currentLatitude: 18.5204,
      currentLongitude: 73.8567,
    },
    create: {
      organizationId: org.id,
      userId: nileshUser.id,
      employeeCode: 'AG001',
      phone: '+91 74981 62774',
      status: 'ONLINE',
      currentLatitude: 18.5204,
      currentLongitude: 73.8567,
      territory: 'Pune',
    },
  });

  // Generic Agent fallback
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@gmail.com' },
    update: {
      passwordHash: agentPwHash,
    },
    create: {
      organizationId: org.id,
      email: 'agent@gmail.com',
      passwordHash: agentPwHash,
      firstName: 'Agent',
      lastName: 'User',
      role: 'AGENT',
    },
  });

  await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      organizationId: org.id,
      userId: agentUser.id,
      employeeCode: 'AG002',
      phone: '+91 98765 43210',
      status: 'ONLINE',
      currentLatitude: 28.5921,
      currentLongitude: 77.0460,
      territory: 'Delhi NCR',
    },
  });

  console.log('✅ Users & Profiles Seeded:');
  console.log('   🛡️ Admin:  bitlanceai@gmail.com / admin@123');
  console.log('   👔 Nilesh: agentnilesh@gmail.com / nilesh@123');
  console.log('   👔 Agent:  agent@gmail.com / agent@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
