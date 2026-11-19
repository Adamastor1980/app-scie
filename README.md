# SCIE/CALC — Segurança Contra Incêndio em Edifícios

Aplicação web para classificar as 12 utilizações-tipo (UT I a XII), calcular o efetivo e a densidade de carga de incêndio modificada, identificar as medidas de segurança exigíveis e gerar o relatório técnico em PDF.

Base legal (PDF oficiais em `docs/legislacao/`):

- **RJ-SCIE** — Decreto-Lei n.º 220/2008, na redação da Lei n.º 123/2019 (arts. 2.º, 8.º, 10.º a 13.º, 19.º, 21.º e anexos III, IV e V)
- **RT-SCIE** — Portaria n.º 1532/2008, na redação da Portaria n.º 135/2020 (quadros I a LI)
- **Despacho n.º 2074/2009**, na redação do Despacho n.º 8954/2020 (métodos determinístico e probabilístico, quadros I e II)

## Funcionalidades

- Projetos → edifícios → utilizações-tipo. Começa-se por escolher a UT e só são pedidos os fatores de risco do quadro do anexo III dessa UT.
- **Efetivo** (art. 51.º): índices do quadro XXVII, camas, acamados ×3,2, tipologias Tn, lugares fixos, quadro XXVIII, art. 283.º (UT IX), valor declarado com mínimo de 0,03 p/m², fator 1,3 e não simultaneidade (n.º 9).
- **Carga de incêndio modificada**: método determinístico (Σ Mi·Hi·Ci·Rai) e probabilístico (atividades Σ qsi·Si·Ci·Rai; armazenamento Σ qvi·hi·Si·Ci·Rai), por compartimento corta-fogo, regra do n.º 7.º, 3 para o Rai e média da UT (n.º 4.º). Os 136 produtos do quadro I e as 464 atividades do quadro II são pesquisáveis.
- **Categoria de risco** com o quadro do anexo III assinalado, o fator determinante e as consequências (entidade competente, inspeções, autoproteção).
- **Medidas**: cerca de 70 exigências por UT, concretizadas (classes de resistência e reação ao fogo, saídas e UP por espaço, configuração do alarme, extintores por piso, RIA, redes seca e húmida, sprinklers, controlo de fumo, posto de segurança, quadros XXXIX e XLI…). Cada uma traz o artigo e o quadro de onde resulta e fica marcada como «aplicável», «a verificar» ou «não aplicável», neste caso com o motivo.
- **Relatório** estruturado segundo o anexo IV do RJ-SCIE (memória descritiva): capa e apresentação da empresa, caracterização, classificação, cálculos, medidas, autoproteção, peças desenhadas (imagens ou PDF) e termo do autor. Exporta para PDF pela impressão do browser.
- Os dados ficam guardados no browser (IndexedDB). Cada projeto pode ser exportado e importado em JSON.

## Desenvolvimento

```bash
cd app
npm install
npm run dev      # servidor de desenvolvimento
npm test         # testes dos cálculos (vitest)
npm run build    # versão de produção em app/dist
```

O quadro II do Despacho foi extraído do PDF oficial com `pdftotext -layout`, preservando as colunas de fabrico (qsi) e de armazenamento (qvi), por `scripts/parse_quadro2.py`.
