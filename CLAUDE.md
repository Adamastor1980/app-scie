# Cautela SCIE — regras de trabalho

## Antes de alterar
- Não alterar só porque o utilizador pede. Verificar primeiro se faz sentido, técnica e legalmente.
- Se não fizer sentido, dizer porquê, com a base legal, e propor a alternativa certa. Não alterar até haver acordo.
- Se o pedido estiver certo, fazê-lo e explicar porquê.
- Exemplo do que não repetir: os «pisos acima» foram alterados para não contar o r/c só porque foi pedido, e tiveram de ser repostos. O r/c (piso do plano de referência) conta como piso acima.

## Base de tudo
- Só a lei: Lei n.º 123/2019 (RJ-SCIE), Portaria n.º 135/2020 (RT-SCIE) e Despacho n.º 8954/2020. Os textos estão em `docs/legislacao/` e devem ser consultados sempre que se decide algo legal.
- Cada interpretação legal nova ou alterada é registada em `docs/decisoes.md` (decisão, base legal, porquê, estado).
- Quando a lei for alterada, rever as regras e atualizar `LEI_VERIFICADA_EM` em `app/src/versao.ts`.
- Respostas em português de Portugal, factuais e honestas, mesmo que não vão ao encontro da ideia do utilizador.

## Aplicação
- Menos é mais: mostrar só o que a lei exige para cada caso.
- Campos obrigatórios por preencher: a vermelho, com a frase «Falta preencher» a dizer o quê e para que serve.
- Design limpo e alinhado, a funcionar no telemóvel, no tablet e sem rede.
