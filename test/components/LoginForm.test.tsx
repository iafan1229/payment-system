import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { LoginForm } from '@/features/auth/components/LoginForm';

describe('LoginForm', () => {
  it('submits email and password', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<LoginForm onSubmit={onSubmit} isPending={false} error={null} />);

    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'demo@test.com' }
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'demo@test.com',
      password: 'password123'
    });
  });
});
