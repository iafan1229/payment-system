'use client';

import { useState, type FormEvent } from 'react';

type LoginFormProps = {
  onSubmit: (input: { email: string; password: string }) => Promise<void>;
  isPending: boolean;
  error: string | null;
};

export function LoginForm({ onSubmit, isPending, error }: LoginFormProps) {
  const [email, setEmail] = useState('demo@hopae.com');
  const [password, setPassword] = useState('password123');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ email, password });
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>이메일</span>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </label>
      <label className="field">
        <span>비밀번호</span>
        <input
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={isPending}>
        {isPending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}
