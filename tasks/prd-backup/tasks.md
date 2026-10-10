# Resumo das tarefas de implementação de Backup e restauração

## Tarefas

- [x] 1.0 domain: formato, validação e zip — `backup-format`, `backup-errors`, `backup-manifest-write/read`, `backup-validate`, `backup-zip` e fixtures de teste
- [x] 2.0 domain: exportação e entrega — `backup-records`, `backup-images`, `backup-export`, `backup-estimate`, `file-delivery` e `backup-labels`
- [x] 3.0 domain: plano, aplicação atômica e restauração — `backup-plan`, `backup-apply*`, `backup-restore` e `backup-reminder`
- [x] 4.0 state e rota: `backup-store`, `backup-session` e a rota `/ajustes/backup`
- [x] 5.0 pages: tela `/ajustes/backup` e a seção “Backup” com o aviso de 30 dias em Ajustes
- [x] 6.0 Validação final — CI local e preparação dos roteiros E2E-16 e E2E-B1–B12
