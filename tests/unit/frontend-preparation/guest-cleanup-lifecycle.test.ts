import {spawnSync} from 'child_process';
/** Loading the service without an HTTP listener must not strand test/tool processes. */
it('lets a process exit naturally while retaining the server-owned periodic cleanup service',()=>{
 const child=spawnSync(process.execPath,['--import','tsx','-e',"const {GuestDeckPersistenceService}=require('./src/services/guestDeckPersistence.ts');new GuestDeckPersistenceService();"],{cwd:process.cwd(),encoding:'utf8',timeout:3000});
 expect(child.error).toBeUndefined();expect(child.status).toBe(0);
});
