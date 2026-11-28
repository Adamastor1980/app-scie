# Cautela — regras de trabalho

A Cautela tem módulos independentes: **SCIE** e **Avaliação de riscos (SST)**. Cada módulo tem a sua base legal, o seu código e as suas decisões; retirar um não pode afetar o outro. Comum a todos: a conta, «A minha empresa» (empresa, autor, assinatura) e o aspeto visual.

## Antes de alterar
- Não alterar só porque o utilizador pede. Verificar primeiro se faz sentido, técnica e legalmente.
- Se não fizer sentido, dizer porquê, com a base legal, e propor a alternativa certa. Não alterar até haver acordo.
- Se o pedido estiver certo, fazê-lo e explicar porquê.
- Exemplo do que não repetir: os «pisos acima» foram alterados para não contar o r/c só porque foi pedido, e tiveram de ser repostos. O r/c (piso do plano de referência) conta como piso acima.

## Base de tudo — só a lei, por módulo
- **SCIE:** Lei n.º 123/2019 (RJ-SCIE), Portaria n.º 135/2020 (RT-SCIE) e Despacho n.º 8954/2020. Decisões em `docs/decisoes.md`. Quando a lei for alterada, rever as regras e atualizar `LEI_VERIFICADA_EM` em `app/src/versao.ts`.
- **Avaliação de riscos (SST):** Lei n.º 102/2009 (regime jurídico da promoção da segurança e saúde no trabalho) — obrigatória daqui em diante para este módulo; método SSARA (NTP 330 do INSST), tal como na matriz do utilizador. Decisões em `docs/riscos/decisoes.md`.
  - ⚠️ O texto em `docs/legislacao/lei_102_2009.pdf` é a publicação original (DR, 10-09-2009). A lei foi alterada várias vezes: usar a versão consolidada quando o utilizador a fornecer e, até lá, assinalar que as citações seguem o texto original.
- Os textos estão em `docs/legislacao/` e devem ser consultados sempre que se decide algo legal.
- Cada interpretação legal nova ou alterada é registada no ficheiro de decisões do módulo (decisão, base legal, porquê, estado).
- Respostas em português de Portugal, factuais e honestas, mesmo que não vão ao encontro da ideia do utilizador.

## Aplicação
- Menos é mais: mostrar só o que a lei exige para cada caso.
- Campos obrigatórios por preencher: a vermelho, com a frase «Falta preencher» a dizer o quê e para que serve.
- Design limpo e alinhado, a funcionar no telemóvel, no tablet e sem rede.
- Sugestões da app (ex.: biblioteca de perigos e medidas) são sempre sugestões: o técnico valida e assina.
