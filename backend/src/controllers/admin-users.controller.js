import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { logAudit } from '../middleware/auditLog.js';

export async function listUsers(req, res) {
  const users = await prisma.adminUser.findMany({
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { id: 'asc' },
  });
  res.json(users);
}

export async function createUser(req, res) {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'email already exists' });
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: { email, password: hashed, name: name || null },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  await logAudit(req.user?.email, 'CREATE_ADMIN_USER', 'AdminUser', user.id, { email });
  res.status(201).json(user);
}

export async function resetPassword(req, res) {
  const id = parseInt(req.params.id);
  const { password } = req.body || {};
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'password must be at least 8 characters' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.update({
    where: { id },
    data: { password: hashed },
    select: { id: true, email: true, name: true },
  });
  await logAudit(req.user?.email, 'RESET_ADMIN_PASSWORD', 'AdminUser', id, { email: user.email });
  res.json(user);
}

export async function updateUser(req, res) {
  const id = parseInt(req.params.id);
  const { name } = req.body || {};
  const user = await prisma.adminUser.update({
    where: { id },
    data: { name: name || null },
    select: { id: true, email: true, name: true },
  });
  await logAudit(req.user?.email, 'UPDATE_ADMIN_USER', 'AdminUser', id, { name });
  res.json(user);
}

export async function deleteUser(req, res) {
  const id = parseInt(req.params.id);
  // Don't allow deleting yourself
  if (req.user?.id === id) {
    return res.status(400).json({ error: "You can't delete your own account" });
  }
  const count = await prisma.adminUser.count();
  if (count <= 1) return res.status(400).json({ error: 'Cannot delete the last admin user' });
  const user = await prisma.adminUser.delete({ where: { id } });
  await logAudit(req.user?.email, 'DELETE_ADMIN_USER', 'AdminUser', id, { email: user.email });
  res.json({ ok: true });
}
