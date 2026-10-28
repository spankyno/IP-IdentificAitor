import { json } from '../_mocks';

interface Env {
  LAYERCALL_API_KEY?: string;
  IPQS_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const hasApiKey = Boolean(
    (context.env.LAYERCALL_API_KEY && context.env.LAYERCALL_API_KEY.trim().length > 0) ||
      (context.env.IPQS_API_KEY && context.env.IPQS_API_KEY.trim().length > 0)
  );
  return json({ hasApiKey, isDev: false });
};
