import { RuleTester } from 'eslint';
import config from '../eslint.config.js';
const rule=config.find(item=>item.plugins?.['request-lifecycle']).plugins['request-lifecycle'].rules['safe-fetch-effect'];
new RuleTester({languageOptions:{ecmaVersion:2022,sourceType:'module'}}).run('safe-fetch-effect',rule,{
  valid:[
    'useEffect(()=>{window.scrollTo(0,0);},[]);',
    'useEffect(()=>{const c=new AbortController();const t=setTimeout(()=>fetch("/api",{signal:c.signal}),0);return()=>{clearTimeout(t);c.abort();};},[]);',
  ],
  invalid:[
    {code:'useEffect(()=>{fetch("/api");},[]);',errors:[{messageId:'cleanup'}]},
    {code:'useEffect(()=>{companiesApi.metadata();},[]);',errors:[{messageId:'cleanup'}]},
    {code:'useEffect(()=>{const c=new AbortController();const t=setTimeout(()=>fetch("/api",{signal:c.signal}),0);return()=>{c.abort();clearTimeout(t);};},[]);',errors:[{messageId:'cleanup'}]},
  ],
});
