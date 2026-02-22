import { Hono } from 'hono';
import { RegisterUserUseCase } from '../application/RegisterUser';
import { LoginUserUseCase } from '../application/LoginUser';
import { ForgetPasswordUseCase } from '../application/ForgetPassword';
import { ResetPasswordUseCase } from '../application/ResetPassword';
import { DrizzleUserRepository } from '../infrastructure/DrizzleUserRepository';

const authRoutes = new Hono();
const userRepository = new DrizzleUserRepository();

const jwtSecret = process.env.JWT_SECRET || 'supersecretkey_change_in_production';

const registerUserUseCase = new RegisterUserUseCase(userRepository);
const loginUserUseCase = new LoginUserUseCase(userRepository, jwtSecret);
const forgetPasswordUseCase = new ForgetPasswordUseCase(userRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepository);

authRoutes.post('/register', async (c) => {
    try {
        const body = await c.req.json();
        const user = await registerUserUseCase.execute(body.email, body.password);
        return c.json(user, 201);
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
});

authRoutes.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const result = await loginUserUseCase.execute(body.email, body.password);
        return c.json(result);
    } catch (error: any) {
        return c.json({ error: error.message }, 401);
    }
});

authRoutes.post('/forget-password', async (c) => {
    try {
        const body = await c.req.json();
        const token = await forgetPasswordUseCase.execute(body.email);

        // In a real app we wouldn't return the token, we'd email it.
        // For local development, we print it securely to the backend console instead.
        console.log(`\n📧 [DEV EMAIL SIMULATOR] Password reset requested for ${body.email}. Token: ${token}\n`);
        return c.json({ message: 'If an account exists, a reset link was generated.' });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
});

authRoutes.post('/reset-password', async (c) => {
    try {
        const body = await c.req.json();
        const success = await resetPasswordUseCase.execute(body.token, body.newPassword);

        if (!success) {
            return c.json({ error: 'Invalid or expired token' }, 400);
        }

        return c.json({ message: 'Password reset successfully' });
    } catch (error: any) {
        return c.json({ error: error.message }, 400);
    }
});

export default authRoutes;
