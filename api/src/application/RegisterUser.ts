import { User, IUserRepository } from '../domain/User';

export class RegisterUserUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(email: string, passwordPlain: string): Promise<Omit<User, 'passwordHash'>> {
        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new Error('User already exists');
        }

        const passwordHash = await Bun.password.hash(passwordPlain);

        const user: User = {
            id: crypto.randomUUID(),
            email,
            passwordHash,
            resetToken: null,
            resetTokenExpiry: null,
            createdAt: new Date(),
        };

        await this.userRepository.save(user);

        return {
            id: user.id,
            email: user.email,
            resetToken: user.resetToken,
            resetTokenExpiry: user.resetTokenExpiry,
            createdAt: user.createdAt,
        };
    }
}
