# Avaliação de riscos (SST) — decisões

Módulo independente do SCIE (código em `app/src/riscos/`, dados em `users/{uid}/riscos/{id}` na nuvem e `cautela-riscos-v1` no aparelho). Comum aos módulos: conta, «A minha empresa» (empresa, autor, assinatura) e aspeto visual.

Base legal: Lei n.º 102/2009 (`docs/legislacao/lei_102_2009.pdf`). ⚠️ O PDF é o texto **original** (DR 1.ª série n.º 176, 10-09-2009); a lei foi alterada depois. Até haver a versão consolidada, as citações na app e no relatório dizem que seguem o texto original.

| N.º | Decisão | Base | Porquê | Estado |
|---|---|---|---|---|
| R-01 | Método SSARA (NTP 330 do INSST): NP = ND × NE; NR = NP × NC; quadros 1, 3, 4, 6 e 8 como na matriz V5.0 do utilizador | Lei 102/2009 art. 15.º n.º 2 c) (planificar a prevenção integrando a avaliação); a lei não impõe método | Método usado pelo utilizador; a lei deixa a escolha ao técnico | Ativa |
| R-02 | Nível de intervenção: ≥ 600 I; ≥ 150 II; ≥ 40 III; restantes IV | NTP 330, quadro 8 (limiares da matriz) | Igual à folha de cálculo do utilizador | Ativa |
| R-03 | Quadro 2 (ajuda ao ND): não cumpre a lei e sem informação → 10; não cumpre a lei → 6; cumpre mas falta informação ou formação → 2; tudo sim → 1 | Matriz V5.0 | Combinações da matriz; é opcional, o técnico pode escolher o ND diretamente | Ativa — confirmar com o orientador |
| R-04 | Risco residual aceitável se nível III ou IV (NR' < 150) | Critério da matriz; art. 15.º n.º 3 (níveis eficazes de proteção) | A lei não fixa um valor; é critério técnico, dito como tal no relatório | Ativa |
| R-05 | Medidas obrigatórias («Falta preencher») quando NR ≥ 150 | Art. 15.º n.º 3 | As medidas devem corresponder ao resultado da avaliação | Ativa |
| R-06 | Hierarquia das medidas 1–5: eliminação › substituição › proteção coletiva › organizativa/formação › EPI | Art. 15.º n.º 2 a), g), h), i), l) | Princípios gerais de prevenção; proteção coletiva antes da individual | Ativa |
| R-07 | Biblioteca de perigos e tipos de local: só sugestões (perigo, risco, NC típico, medidas). ND e NE nunca são sugeridos | CLAUDE.md; art. 100.º (atividade técnica com autonomia) | Dependem do que se observa no local; o técnico valida e assina, e o termo do relatório declara-o | Ativa |
| R-08 | Versões Light e Completa, escolhidas por avaliação e trocáveis | — | Pedido do utilizador; Light mostra só o essencial (menos é mais) | Ativa |
| R-09 | Campos obrigatórios: entidade, local, atividade, data, elaborado por (+ executante na Completa); por risco: atividade, perigo, risco, ND, NE, NC (+ área na Completa) | Arts. 15.º, 98.º n.º 1 b) e n.º 2 a) | Sem eles não há avaliação identificável nem cálculo | Ativa |
| R-10 | Consulta dos trabalhadores registada (não bloqueia) | Art. 18.º n.º 1 a) e n.º 6 | É obrigação do empregador, que o técnico pode não conhecer no momento | Ativa |
| R-11 | Relatório: enquadramento legal (arts. 5.º, 15.º, 18.º, 19.º, 20.º, 98.º, 100.º), metodologia, resultados, fichas, plano de ação, reavaliação (Completa), conclusões, termo | Art. 98.º n.º 1 b) | Relatório da avaliação exigido ao serviço de SST | Ativa |
| R-12 | A lei não fixa periodicidade de revisão; a app pede a data como decisão técnica e o relatório diz que se revê quando as condições mudam | Art. 15.º | Não inventar prazos que a lei não tem | Ativa |
