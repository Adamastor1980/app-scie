# Registo de decisões — Cautela SCIE

Cada entrada regista uma interpretação da lei feita na aplicação: o que se decidiu, a base legal, porquê, e o que ficou por confirmar.
Serve de base ao capítulo de metodologia e à secção de limitações do projeto final (Licenciatura em Engenharia da Segurança do Trabalho, ISLA Gaia, 2026/2027).

**Diplomas** (únicos admitidos como base, textos em `docs/legislacao/`):
- **RJ-SCIE** — Decreto-Lei n.º 220/2008, de 12 de novembro, na redação da Lei n.º 123/2019, de 18 de outubro;
- **RT-SCIE** — Portaria n.º 1532/2008, de 29 de dezembro, na redação da Portaria n.º 135/2020, de 2 de junho;
- **Despacho** — Despacho n.º 2074/2009, de 15 de janeiro, na redação do Despacho n.º 8954/2020, de 18 de setembro.

**Estados:** ✅ decidido · ⚠️ a confirmar com o orientador ou com a ANEPC.

**Última verificação das regras contra os textos publicados:** 24/11/2026.

---

## 1. Princípios de trabalho

### D-01 — Só a lei como base ✅
- **Decisão:** todas as regras da aplicação saem do RJ-SCIE, do RT-SCIE e do Despacho. Notas técnicas da ANEPC, normas e boas práticas não são usadas como exigência.
- **Porquê:** separar o que é obrigação legal do que é recomendação; tornar cada resultado verificável no texto oficial.
- **Exceção assumida:** o guia «Como escolher o Ci» indica onde encontrar o ponto de inflamação (FDS, secções 2 e 9) e lê as advertências H do Regulamento CLP. Está assinalado na app como «orientação técnica» e não como exigência legal.

### D-02 — Cada valor cita diploma, artigo e quadro ✅
- **Decisão:** nenhuma exigência aparece sem a referência completa (ex.: «RT-SCIE, art. 56.º n.º 2 a)»), com acesso ao texto integral do artigo.
- **Porquê:** rastreabilidade; permite ao técnico e à entidade fiscalizadora confirmar cada resultado.

### D-03 — Não alterar só porque é pedido ✅
- **Decisão:** antes de cada alteração verifica-se se faz sentido técnica e legalmente; se não fizer, explica-se a base legal e propõe-se a alternativa (regra registada em `CLAUDE.md`).
- **Origem:** os «pisos acima» foram alterados para não contar o r/c a pedido e tiveram de ser repostos (ver D-08).

### D-04 — Texto da lei seguido à letra, mesmo quando parece estranho ⚠️
- **Decisão:** quando o texto publicado contém algo tecnicamente estranho, segue-se o texto e regista-se a dúvida, em vez de «corrigir» a lei.
- **Casos:** D-27 (quadro XXXVI) e D-31 (quadro XLI).

---

## 2. Categoria de risco

### D-05 — A categoria só é atribuída com todos os critérios preenchidos ✅
- **Decisão:** se faltar um fator do quadro da UT (altura, pisos abaixo, efetivo, área, carga de incêndio), a app mostra «Categoria por atribuir», não gera medidas e avisa no relatório.
- **Base:** RJ-SCIE, art. 13.º n.º 1 — a categoria é «a mais baixa que satisfaça **integralmente** os critérios».
- **Porquê:** uma categoria calculada com dados em falta seria tendencialmente baixa e, por isso, insegura.

### D-06 — Cada UT pede só os seus fatores de risco ✅
- **Decisão:** cada UT mostra apenas os fatores do art. 12.º n.º 2 (ex.: UT I — altura e pisos abaixo; UT III — altura e efetivo; UT XII — carga de incêndio e pisos abaixo).
- **Base:** RJ-SCIE, art. 12.º n.º 2 e anexo III, quadros I a X.

### D-07 — «0» tem de ser confirmado ✅
- **Decisão:** altura 0 e pisos abaixo 0 só contam quando o técnico os escreve ou carrega em «Confirmar 0». Uma caixa vazia não equivale a 0.
- **Porquê:** distinguir «não há pisos abaixo» de «ainda não preenchi».

### D-08 — O r/c (piso do plano de referência) conta como piso acima ✅
- **Decisão:** pisos acima = do piso 0 ao último piso (r/c com cave = 1 acima e 1 abaixo).
- **Base:** RJ-SCIE, art. 2.º a) — a altura mede-se a partir do plano de referência, e o piso desse plano está acima do solo; caracterização do edifício (anexo IV).
- **Histórico:** chegou a ser alterado para não contar o r/c e foi reposto.

### D-09 — A categoria da UT é a mais alta entre os seus critérios ✅
- **Decisão:** cada fator dá uma categoria pelo seu quadro; a categoria da UT é a mais alta. O relatório mostra, para a carga de incêndio, a linha do quadro IX/X com a categoria por esse critério e a categoria final.
- **Base:** RJ-SCIE, art. 13.º n.os 1 e 2.

### D-10 — Armazém exclusivo: limites de carga ×10 ✅
- **Base:** RJ-SCIE, anexo III, nota (**) dos quadros IX e X.

### D-11 — Competência, autoria e vistoria pela categoria do edifício ✅
- **Decisão:** a entidade competente, a exigência de autor certificado, a vistoria com a ANEPC, a ficha de segurança ou o projeto, e a fonte central de emergência usam a categoria mais alta das UT do edifício; as medidas técnicas usam a categoria de cada UT.
- **Base:** RJ-SCIE, arts. 5.º n.º 1, 15.º-A n.º 1, 17.º e 18.º n.º 3 («edifícios e recintos classificados…»); RT-SCIE, art. 72.º n.º 1 («edifícios … que possuam UT das 3.ª ou 4.ª categorias»).

---

## 3. Utilizações-tipo e espaços

### D-12 — O mesmo uso no mesmo edifício é uma só UT ✅
- **Decisão:** duas UT do mesmo tipo no mesmo edifício geram um aviso a vermelho e a opção «Juntar».
- **Base:** RJ-SCIE, art. 8.º.
- **Nota:** um edifício de 10 andares de escritórios é uma UT III, não dez.

### D-13 — Espaços integrados que excedem os limites passam a outra UT ✅
- **Decisão:** a app avisa quando um espaço deixa de poder ficar integrado: reuniões, culto, formação, desporto e restauração com mais de 200 pessoas (1000 ao ar livre); comércio, oficinas, bibliotecas, exposição e postos médicos com mais de 200 m²; administrativos, arquivo e armazenamento acima de 10 % ou 20 % da área da UT.
- **Base:** RJ-SCIE, art. 8.º n.º 3 a) a c).
- **Limitação:** a lei usa a área bruta e a app recebe a área útil dos espaços; perto do limite a app pede confirmação.

### D-14 — Local A passa a B automaticamente ✅
- **Decisão:** efetivo > 100 ou efetivo de público > 50 → local B; volta a A se o efetivo descer, salvo se o técnico escolheu B.
- **Base:** RJ-SCIE, art. 10.º n.º 1 a) e b).

### D-15 — Uma só lista de pisos por UT, ligada pelo número ✅
- **Decisão:** os pisos vêm do piso de cada espaço; a tabela de pisos guarda só a cota e a área; espaço e piso ligam-se pelo número (antes, pelo nome escrito).
- **Porquê:** a regra das 2 UP abaixo do nível de saída (RT-SCIE, art. 56.º n.º 4 b)) deixava de se aplicar quando os nomes não coincidiam.
- **Interpretação:** um piso está abaixo do nível de saída pela cota, se indicada; senão, pelo número. ⚠️ A lei fala em «nível de saída para o exterior», que nem sempre é o plano de referência.

---

## 4. Efetivo

### D-16 — Efetivo da UT = soma dos espaços, arredondados ao inteiro superior ✅
- **Base:** RT-SCIE, art. 51.º n.os 1 a 3, quadros XXVI e XXVII.

### D-17 — O fator 1,3 só dimensiona a evacuação ✅
- **Decisão:** o efetivo com pessoas de mobilidade reduzida ×1,3 é usado só em saídas e vias de evacuação, não na categoria.
- **Base:** RT-SCIE, art. 51.º n.º 5 (e art. 232.º na UT V).

### D-18 — UT XII: efetivo declarado, com mínimo de 0,03 pessoas/m² ✅
- **Base:** RT-SCIE, art. 51.º n.º 2 e). Os índices do quadro XXVII só se usam em espaços de outra natureza integrados (escritórios, refeitórios, balneários).

### D-19 — Efetivo do subsolo, para o controlo de fumo, contado piso a piso ✅
- **Base:** RT-SCIE, art. 135.º n.º 1 d) — «pisos situados no subsolo, desde que possuam um efetivo superior a 200 pessoas».

---

## 5. Carga de incêndio

### D-20 — Fórmulas do Despacho, sem simplificações ✅
- **Decisão:** Qs = Σ parcelas; qs = Qs / S; q da UT = Σ Qsk / Σ Sk (média ponderada pela área, não média simples).
- **Base:** Despacho, n.os 3.º e 4.º; Ci n.º 6.º; Hi quadro I (n.º 5.º); Rai, qsi e qvi quadro II (n.º 7.º).

### D-21 — Litros convertidos em quilos pela densidade ✅
- **Decisão:** massa = volume × densidade (FDS, secção 9), registada no relatório.
- **Porquê:** o método determinístico usa massa (Mi, em kg).

---

## 6. Medidas exigíveis

### D-22 — Aplicabilidade decidida por factos do local ✅
- **Decisão:** medidas que a lei exige «se existir» (elevadores, AVAC, cozinhas, pátios, tendas…) ficam «a verificar» até o técnico responder Sim ou Não.
- **Porquê:** não presumir que existe ou que não existe.

### D-23 — Quadro XXIX não se aplica às UT I e II ✅
- **Base:** RT-SCIE, art. 54.º n.º 1 («com exceção das utilizações-tipo I e II»). As unidades de passagem continuam a aplicar-se (art. 56.º).

### D-24 — UT I da 1.ª categoria só dispensa os 15 m em impasse ✅
- **Base:** RT-SCIE, art. 57.º n.º 2 a). Os 30 m da alínea b) aplicam-se.

### D-25 — Resistência ao fogo: «um só piso no plano de referência» avaliado no edifício ✅
- **Base:** RT-SCIE, art. 15.º n.os 2, 4 e 6 — o n.º 4 admite pisos abaixo; a isenção da UT I da 1.ª categoria só vale para habitação unifamiliar (n.º 6 a)), que passou a ser uma pergunta.

### D-26 — Quadro XXIII lido pela altura de cada piso ✅
- **Base:** RT-SCIE, art. 39.º, quadro XXIII («em pisos até 9 m», «entre 9 e 28 m», «acima de 28 m ou abaixo»). A app mostra as faixas que existem no edifício.

### D-27 — Quadro XXXVI: difusão do alarme no exterior só na configuração 2 ⚠️
- **Decisão:** segue-se o quadro tal como publicado (DR n.º 107, 2.6.2020, pág. 129), confirmado na imagem do PDF.
- **Dúvida:** tecnicamente seria de esperar também na configuração 3. Possível gralha; a confirmar.

### D-28 — Zonas de refúgio pelos pisos que a UT ocupa ✅
- **Base:** RT-SCIE, art. 68.º n.º 1 — UT da 4.ª categoria (ou III da 3.ª) «que ocupem pisos com altura superior a 28 m»; usa-se a altura da UT, não a do edifício.

### D-29 — Título VIII com o texto literal, artigo a artigo ✅
- **Decisão:** cada artigo em vigor das condições específicas da UT (arts. 208.º a 309.º) é uma medida com o texto publicado; revogados excluídos; UT III e IV sem capítulo.
- **Porquê:** não deixar nada de fora e não depender de paráfrase.
- **Limitação:** não são regras calculadas; o técnico marca Cumpre, Não cumpre ou N.A. Os quadros desses artigos aparecem em texto corrido.

---

## 7. Autoproteção

### D-30 — Quadro XXXIX tal como publicado ✅
- **Decisão:** UT I 3.ª e UT II 2.ª com procedimentos de prevenção (não plano), confirmado na imagem do PDF; UT I das 1.ª e 2.ª categorias sem medidas (RJ-SCIE, art. 22.º n.º 1); UT I 3.ª e 4.ª só espaços comuns.

### D-31 — Simulacros: contradição entre o quadro XLI e o art. 207.º ⚠️
- **Facto:** o quadro XLI indica «dois anos» para a 2.ª categoria das UT III, VI, VIII a XII, mas o art. 207.º n.º 1 só exige simulacros com plano de emergência interno, que o quadro XXXIX não exige nessa categoria.
- **Decisão:** a app não exige simulacros nesses casos e explica a contradição; se houver PEI voluntário, aplica-se o período do quadro XLI.

---

## 8. Documentos

### D-32 — Relatório com a base legal datada e a versão da aplicação ✅
- **Decisão:** a ficha técnica, a introdução, o documento das medidas de autoproteção e o Excel indicam a legislação em vigor à data do documento, a versão da Cautela SCIE e a data da última verificação das regras.
- **Porquê:** um relatório tem de ser avaliado pela lei em vigor quando foi feito; a versão permite saber se foi gerado antes ou depois de uma correção.

---

## 9. Limitações conhecidas (para a tese)

1. A aplicação não substitui o juízo do técnico autor do projeto nem a apreciação da entidade competente.
2. A área útil dos espaços aproxima a área bruta que a lei usa em alguns limites (D-13).
3. «Nível de saída para o exterior» aproximado pelo plano de referência quando não há cotas (D-15).
4. Título VIII verificado pelo técnico, não calculado (D-29).
5. Dúvidas sobre o texto publicado: D-27 e D-31.
6. A aplicação tem de ser revista sempre que a legislação for alterada (D-32).
7. Validação com casos reais aprovados: por fazer.
