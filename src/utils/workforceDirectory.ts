import company from '../../azre-ai-workforce/config/company.json';
export const corporateConfig=company;
import registry from '../../azre-ai-workforce/config/agents.json';
export const operationsEmployee=registry.find(a=>a.id==='azre-operations-manager')!;
export const acquisitionsEmployee=registry.find(a=>a.id==='azre-acquisitions-manager')!;
// Open the authenticated workforce surface. Provider credentials never enter this link.
export function operationsCommandUrl(){const configured=import.meta.env.VITE_WORKFORCE_URL||'http://127.0.0.1:3101';try{const u=new URL(configured);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error();u.pathname='/operations';u.search='';u.hash='';return u.toString();}catch{return 'http://127.0.0.1:3101/operations';}}
