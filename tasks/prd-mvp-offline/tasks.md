# Resumo das tarefas de implementação de MVP offline

## Tarefas

- [x] 1.0 Fundação do projeto
- [x] 2.0 Domínio: persistência
- [x] 3.0 Domínio: marcas de texto
- [x] 4.0 Domínio: agendamento e fila
- [x] 5.0 Domínio: apoio às telas
- [x] 6.0 Estado e casca
- [x] 7.0 Cadastro de cartões
- [x] 8.0 Revisão e Home
- [x] 9.0 Lista, Progresso e Ajustes
- [x] 10.0 Offline, PWA e preview

## Dependências

| Tarefa | Depende de |
| --- | --- |
| 1.0 | — |
| 2.0 | 1.0 |
| 3.0 | 1.0 |
| 4.0 | 2.0 |
| 5.0 | 4.0 |
| 6.0 | 2.0, 4.0 |
| 7.0 | 3.0, 6.0 |
| 8.0 | 5.0, 7.0 |
| 9.0 | 5.0, 8.0 |
| 10.0 | 9.0 |

2.0 e 3.0 podem correr em paralelo.

## Rastreabilidade

| Critério | Tarefas |
| --- | --- |
| CA-01 | 2.0, 7.0 |
| CA-02 | 7.0 |
| CA-03 | 2.0, 7.0 |
| CA-04, CA-05 | 3.0, 8.0 |
| CA-06 | 3.0, 7.0, 8.0 |
| CA-07, CA-08 | 3.0, 7.0 |
| CA-09 | 2.0, 6.0 |
| CA-10 | 4.0, 6.0 |
| CA-11 | 5.0, 8.0 |
| CA-12 | 4.0, 8.0 |
| CA-13 | 4.0, 8.0 |
| CA-14 | 8.0 |
| CA-15, CA-16 | 5.0, 9.0 |
| CA-17 | 10.0 |
| CA-21 | 9.0, 10.0 |
| CA-22 | 10.0 |
| CA-23 | 1.0, 5.0, 10.0 |

| Teste | Tarefa |
| --- | --- |
| TU-01 a TU-05 | 3.0 |
| TU-06 a TU-08, TI-02, TI-04 | 4.0 |
| TU-09, TU-10, TU-11, TU-17 | 5.0 |
| TU-15, TI-01, TI-03 | 2.0 |
| E2E-01, E2E-03 | 7.0 (formulário), 8.0 (revisão) |
| E2E-02, E2E-04, E2E-06 | 8.0 |
| E2E-05 | 6.0 |
| E2E-07, E2E-10 | 10.0 |
