import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

function stubFetch(implementation: () => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(implementation));
}

describe('App', () => {
  it('renders the command panel title', () => {
    stubFetch(() => new Promise<Response>(() => undefined));
    render(<App />);
    expect(screen.getByRole('heading', { name: 'OPERACIÓN CENTINELA' })).toBeInTheDocument();
  });

  it('shows the API as online when /api/health answers ok', async () => {
    stubFetch(() =>
      Promise.resolve(
        Response.json({
          status: 'ok',
          service: 'helper-abi-api',
          version: '0.1.0',
          time: '2026-11-06T12:00:00.000Z',
        }),
      ),
    );
    render(<App />);
    expect(await screen.findByText(/En línea · helper-abi-api v0\.1\.0/)).toBeInTheDocument();
  });

  it('shows a visible error when the API is unreachable', async () => {
    stubFetch(() => Promise.reject(new Error('Failed to fetch')));
    render(<App />);
    expect(await screen.findByText(/Sin conexión · Failed to fetch/)).toBeInTheDocument();
  });

  it('rejects unexpected API payloads', async () => {
    stubFetch(() => Promise.resolve(Response.json({ hello: 'world' })));
    render(<App />);
    expect(await screen.findByText(/Respuesta inesperada de la API/)).toBeInTheDocument();
  });
});
