import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';

import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { Role } from './enums/role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const email = 'mujaahidrafiq+743@gmail.com';
  const phoneNumber = '03074300000';
  const password = '123456';
  const fullName = 'Admin User';

  const existingByEmail = await usersService.findByEmail(email);
  const existingByPhone = await usersService.findByPhoneNumber(phoneNumber);
  if (existingByPhone && existingByPhone.id !== existingByEmail?.id) {
    console.error(`Phone number already exists: ${phoneNumber}`);
    await app.close();
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (existingByEmail) {
    Object.assign(existingByEmail, {
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
      isActive: true,
    });
    await usersService.save(existingByEmail);
  } else {
    await usersService.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
      isActive: true,
    });
  }

  console.log(
    existingByEmail
      ? 'Admin user updated successfully:'
      : 'Admin user created successfully:',
    email,
  );
  await app.close();
  process.exit(0);
}

bootstrap().catch(async (error) => {
  console.error('Failed to create admin user:', error);
  process.exit(1);
});
