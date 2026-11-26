# Registo de decisões — Cautela SCIE

Cada entrada regista uma interpretação da lei feita na aplicação: o que se decidiu, a base legal, porquê, e o que ficou por confirmar.
Serve de base ao capítulo de metodologia e à secção de limitações do projeto final (Licenciatura em Engenharia da Segurança do Trabalho, Instituto Politécnico de Gestão e Tecnologia, ISLA Gaia, 2026/2027).

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
- **Validação:** «0 pisos acima» é erro (a vermelho): o piso 0 está sempre ao nível do plano de referência, que é a cota do acesso das viaturas de socorro junto a uma saída direta para o exterior (RJ-SCIE, art. 2.º q); RT-SCIE, anexo I, n.º 54). Com 1 piso acima e altura > 0, a app pede confirmação (só possível com o piso 0 acima do plano de referência).

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

### D-33 — Percurso das MAP: medidas exigíveis antes da verificação no local ✅
- **Decisão:** guia de 10 passos no painel de cada projeto e nas Tabelas legais, com a ordem: recolha → UT → locais de risco → efetivo e categoria → **MAP exigíveis** → **verificação no local** → documentos → relatório → entrega → submissão.
- **Base:** RT-SCIE, art. 198.º, quadro XXXIX (as MAP dependem só da UT, da categoria e dos locais D/E); art. 193.º n.os 3 e 4 (a verificação alimenta as medidas compensatórias); RJ-SCIE, arts. 21.º, 22.º e 34.º n.º 2 (submissão obrigatória salvo UT I das 1.ª e 2.ª categorias; edifícios existentes sem MAP estão fora de prazo).

### D-34 — Estado «Por verificar» e evidências opcionais ✅
- **Decisão:** além de Cumpre / Não cumpre / N.A., uma exigência pode ficar «Por verificar», com o que falta para concluir; não conta como verificada e aparece em lista própria no relatório. Fotografias de evidência opcionais em «Cumpre» e «Por verificar»; no relatório só com o interruptor «Incluir evidências de conformidade».
- **Porquê:** registar honestamente o que não foi possível confirmar no local (falta de acesso, de certificado), sem o dar como cumprido.

---

## 8. Documentos

### D-32 — Relatório com a base legal datada e a versão da aplicação ✅
- **Decisão:** a ficha técnica, a introdução, o documento das medidas de autoproteção e o Excel indicam a legislação em vigor à data do documento, a versão da Cautela SCIE e a data da última verificação das regras.
- **Porquê:** um relatório tem de ser avaliado pela lei em vigor quando foi feito; a versão permite saber se foi gerado antes ou depois de uma correção.

### D-35 — Ficha de segurança: dados para o modelo oficial, não um modelo próprio ✅/⚠️
- **Decisão:** a app gera os dados da ficha de segurança da 1.ª categoria pela numeração do modelo da ANEPC (quadros 1 a 10), para transcrever para o modelo oficial; não reproduz nem altera o modelo (RJ-SCIE, art. 17.º n.º 2; anexo V, art. 1.º — modelos definidos e atualizados exclusivamente pela ANEPC).
- **Preenchido pela app:** caracterização (2), valores mínimos dos quadros do RT-SCIE (4 e 5), efetivo (6), configuração do alarme, espaços com controlo de fumo e extintores (8), «Cumpre» S/N/NA/? a partir da verificação no local, não conformidades (9.1) e MAP exigíveis (9.2). À mão: registo predial, licenças, medidas reais da via, n.º de frações/escadas/ascensores, tipos de extintores e assinatura.
- ⚠️ **Discrepâncias do modelo obtido em 25/11/2026 (ficha-de-seguranca_v2.doc) face à lei em vigor:** exclui as UT IV e V (a lei atual admite ficha nessas UT, com peças desenhadas — RJ-SCIE, art. 17.º n.º 2 e anexo V, art. 2.º n.º 2); cita os diplomas sem as redações de 2019/2020 e a sigla ANPC; notas 8.6 e 8.7 trocadas; a nota 8.3 proíbe centrais via rádio, que o RT-SCIE admite (art. 122.º n.º 1 a) e b)). A app segue a lei; as discrepâncias justificam-se no quadro 9.1 quando relevante. A confirmar com o orientador ou a ANEPC.

### D-36 — Dimensionamento de extintores ✅/⚠️
- **Decisão:** por piso, os dois critérios do art. 163.º n.º 2 em simultâneo — a) 18 L de agente padrão por 500 m² ou fração e b) 1 extintor por 200 m² ou fração, mínimo 2 — prevalecendo o mais exigente; a app propõe a quantidade e o técnico pode alterá-la. Agente padrão = água (RT-SCIE, anexo I, art. 8.º n.º 2).
- **Conversões (critério técnico, não consta do RT-SCIE):** pó químico kg = L de água ÷ 2; CO₂ kg = L × 0,62. Adotadas ao abrigo do «outro critério devidamente justificado» do art. 163.º n.º 2; fonte: formação académica (ISLA Gaia, 2026). ⚠️ Confirmar a origem com o professor.
- **CO₂ só como complemento:** não conta para a alínea a), por não ter eficácia em fogos da classe A (EN 3). ⚠️ A confirmar com o professor.
- **Situações específicas incluídas:** art. 163.º n.os 4 a 8; arts. 209.º n.º 14, 210.º n.º 6, 211.º n.º 4 (UT I, mesmo nas 1.ª e 2.ª categorias); 226.º (UT II); 273.º (UT VIII — sem água com tração elétrica); 286.º (UT IX, campismo); 307.º (UT XII).
- ⚠️ **Art. 307.º e):** «por cada 1000 l de líquido, adicionais ou fração» lido como **além da alínea d)**, 1 móvel por cada 1000 l acima de 750 l (800 l → 2 móveis; 2000 l → 3). A leitura anterior (1 por cada 1000 l do total) dava menos extintores. O n.º 2 (recipientes metálicos) baixa só a eficácia, não os móveis. A confirmar.
- **Locais C e F:** escolhidos da lista do RJ-SCIE, art. 10.º n.os 3 (C, alíneas a) a n)) e 6 (F, alíneas a) a g)), com a definição do n.º 1 c) e f) à vista; um local sem tipo escolhido não conta e fica em «Falta preencher» (evita classificar como C, por exemplo, uma cozinha ≤ 20 kW).
- **Mapa final (o quê, onde, quantos):** no relatório e no Estudo, cada linha separa o que o RT-SCIE exige (com artigo) da **recomendação técnica** de agente, que só aparece onde a lei não fixa o tipo (locais C e F genéricos — art. 163.º n.º 4) e vem assinalada como não obrigatória (ex.: CO₂ em locais com equipamento eletrónico; água ou espuma em arquivos). Onde a lei fixa o tipo (cozinhas 25F e manta, centrais térmicas 34 B e areia, campismo 21 A/113 B/C, gares 55 B, UT XII por eficácia), só se indica a exigência legal.
- **Projeto «só extintores»:** pede só o que o art. 163.º usa (UT, pisos e áreas, situações próprias; categoria só na UT I) e gera o «Estudo de dimensionamento de extintores»; pode passar a projeto completo sem perder dados.

### D-37 — Capacidades dos extintores: cargas normalizadas, sem mínimo legal ✅
- **Decisão:** a app oferece as cargas normalizadas da EN 3 — água 2, 3, 6 e 9 L; pó químico 1, 2, 3, 4, 6, 9 e 12 kg; CO₂ 2 e 5 kg — e propõe 6 L / 6 kg por omissão.
- **Base legal:** o RT-SCIE não fixa capacidade mínima; o art. 163.º n.º 2 conta o total de agente padrão (alínea a)) e o n.º de extintores (alínea b)); os extintores devem cumprir a EN 3 (anexo I, art. 8.º n.º 9).
- **Porquê:** permite mais extintores mais pequenos (ex.: 5 × pó 2 kg em vez de 3 × água 6 L em 300 m²), cumprindo as duas alíneas. Nota técnica mostrada ao técnico: cada extintor pequeno tem menor eficácia.

### D-38 — Assinatura desenhada nos documentos ✅
- **Decisão:** o autor assina uma vez em «A minha empresa» (dedo, caneta ou rato); a imagem aparece no termo do autor do relatório, do estudo de extintores e do documento MAP, e pode ser retirada em cada documento.
- **Base legal:** RJ-SCIE, art. 32.º n.º 3 — nas comunicações eletrónicas exige-se, quando aplicável, assinatura eletrónica que satisfaça pelo menos os requisitos da assinatura eletrónica avançada. Uma imagem desenhada não cumpre.
- **Porquê:** serve para cópias em papel e para o cliente; para entrega eletrónica à ANEPC ou à câmara o PDF tem de ser assinado também com Cartão de Cidadão ou Chave Móvel Digital. O aviso está junto ao quadro de assinatura.

### D-39 — Plano de manutenção de extintores ✅/⚠️
- **Decisão:** novo tipo de projeto «Plano de manutenção» (botão «Extintores» › Plano de manutenção), também disponível nos projetos de dimensionamento. Inventário por edifício e piso (EXT-01…), registo de cada intervenção e contagem até à próxima manutenção: verde em dia, laranja a ≤ 60 dias, vermelho em atraso.
- **Base legal:** RT-SCIE, art. 201.º n.º 1 c) — registo das ações de manutenção com o elemento, o tipo e o motivo, a data e o responsável (campos obrigatórios do registo); art. 202.º n.º 4 — programa com calendário; RJ-SCIE, art. 23.º — empresa de manutenção com registo na ANEPC (campo obrigatório); RJ-SCIE, art. 25.º n.º 1 w) — contraordenação por prazos de manutenção ultrapassados.
- ⚠️ **Periodicidade:** 12 meses por omissão, contados da última intervenção registada. Não consta do RT-SCIE: vem da NP 4413, para que remete o anexo I, art. 8.º n.º 9. A norma não está em docs/legislacao/; outros prazos (recarga, prova hidráulica, fim de vida) ficam por configurar quando houver o texto da norma.
- **Limite:** a app regista e controla a manutenção feita por empresa registada; não a substitui.
- **Inventário a partir do dimensionamento:** nos projetos de extintores, o inventário gera-se do mapa — um extintor por unidade (pisos com o agente e a capacidade escolhidos; locais C/F, cozinha 25F, central térmica, móveis e CO₂ com a eficácia exigida). Manta e areia não entram (não são extintores). Itens sem número fixo (ex.: «1 em cada câmara corta-fogo») não são gerados e o técnico é avisado. O local exato fica por indicar (a lei dá o critério, a planta dá o sítio).

### D-40 — Verificação legal dos extintores existentes (só no plano de manutenção) ✅/⚠️
- **Decisão (acordada):** no plano de manutenção, a verificação é **opcional e desligada por omissão** — o plano é a listagem e o registo das manutenções. No projeto de extintores não existe, porque o dimensionamento já parte da UT e de todos os dados.
- **Quando ativada, segue a lei por inteiro:** pede a **utilização-tipo** de cada edifício e os dados do mesmo passo «Extintores» do dimensionamento (áreas, locais de risco C e F, cozinha, central térmica, tendas, condições da UT; na UT I também os fatores da categoria). As exigências saem do mesmo cálculo (dimensionarExtintores): art. 163.º n.os 1 a 8 e arts. 209.º a 211.º, 226.º, 273.º, 286.º e 307.º.
- **Comparação exigência a exigência:** cada extintor existente serve o geral do piso (por omissão) ou uma exigência própria (campo «Para que serve»). Piso: n.º e litros (n.º 2); exigências próprias: quantidade, eficácia mínima (ex.: 25F, 34 B, 21 A/113 B), agente (ex.: pó ABC na central a gás; sem água com tração elétrica) e capacidade dos móveis. Eficácia por indicar → «Verificar».
- **Confirmação no local:** manta ignífuga e areia (não são extintores), quantidades sem número fixo («1 em cada…»), distância ≤ 15 m (n.º 1) e instalação (n.º 3) — o técnico confirma.
- **Contagem para o piso:** pó kg × 2 (D-36); CO₂ e móveis não contam.
- ⚠️ **Espuma como água (1 L = 1 L):** critério técnico, não consta do RT-SCIE. A confirmar com o professor.

### D-41 — Estudo de sinalética (só com o RT-SCIE) ✅/⚠️
- **Decisão (opção B, acordada):** novo tipo de projeto «Sinalética». Por piso, o técnico indica o que está na planta (saídas, vias e comprimentos, mudanças de direção, escadas, extintores, carretéis, botões de alarme, outras); a app dá o **mínimo** de placas e o tamanho mínimo, com o artigo de cada uma.
- **Regras:** aplicabilidade (art. 108.º n.º 4); 1 placa por saída (art. 112.º n.os 1 e 5); vias horizontais: 1 placa de sentido por cada 30 m ou fração (n.º 4, distância máxima entre placas); 1 por mudança de direção (n.º 3); escadas: patamar de acesso e patamar intermédio (n.º 6); extintores (art. 163.º n.º 3), carretéis (art. 164.º), meios de alarme (art. 112.º n.º 2); tamanho A ≥ d²/2000, d entre 6 e 50 m (art. 109.º); regras de instalação dos arts. 110.º a 112.º.
- ⚠️ **Não verificado:** pictogramas, cores e formatos (DL 141/95, Portaria 1456-A/95, EN ISO 7010, ISO 3864, ISO 16069 — art. 108.º n.º 1): citados, textos fora de docs/legislacao/.
- ⚠️ **Mínimo, não contagem final:** «1 por cada 30 m» e «1 por saída» são o mínimo que resulta da lei; a visibilidade a partir de qualquer ponto (art. 112.º n.os 1 e 5) só se confirma na planta. Declarado no ecrã e no documento.
- **Importação:** o n.º de placas «Extintor» por piso pode vir de um projeto de extintores (mapa) ou de manutenção (inventário).

### D-42 — QR nos extintores, pesquisa pelo número e ficha para o cliente ✅
- **Decisão:** cada extintor do plano de manutenção tem uma etiqueta 50 × 30 mm (A4, 4 × 9) com QR, n.º, edifício, piso, local e tipo. O QR leva o endereço `#/x/projeto/extintor` (identificador interno, não o n.º, para não falhar se se renumerar).
- **Ao ler:** o técnico (dono do projeto) abre a ficha do extintor — histórico e o botão «Manutenção efetuada — está tudo OK», que regista hoje uma manutenção periódica conforme com a empresa, o n.º de registo ANEPC e o técnico (obrigatórios: RT-SCIE, art. 201.º n.º 1 c); RJ-SCIE, art. 23.º) e recomeça a contagem do período. Com observações, não conforme ou outra intervenção, abre o registo completo.
- **Leitura:** botão «Ler QR» dentro da app (câmara de trás, leitura no aparelho, funciona sem rede, também no iPhone) e pesquisa pelo n.º escrito no extintor («7» encontra EXT-07). A câmara do telemóvel também abre o endereço (no iPhone, no Safari).
- **Cliente (decisão do utilizador: sempre, não opcional):** cada extintor tem a sua ficha pública (documento `publico/projeto_extintor`), publicada automaticamente com sessão iniciada. Cada QR dá acesso só ao seu extintor. Contém n.º, local, edifício, piso, tipo, eficácia, ano, estado e histórico (data, tipo, resultado, empresa e registo ANEPC, observações), o nome do projeto e do cliente e o contacto da empresa. **Não contém** o nome do técnico (dado pessoal de terceiro — RGPD) nem a morada. Não pode ser listada; só o dono escreve ou apaga; apagar o extintor ou o projeto apaga a ficha. Regras em firebase/firestore.rules (publicar uma vez na consola da Firebase).
- **Etiqueta:** colocar junto ao extintor sem tapar a marcação do fabricante nem a etiqueta da empresa de manutenção.

### D-43 — Rede de incêndio armada do tipo carretel ✅/⚠️
- **Quando é exigida (art. 164.º):** a) UT II a VIII, XI e XII da 2.ª categoria ou superior; b) UT II da 1.ª categoria com espaços cobertos > 500 m²; c) UT I, IX e X da 3.ª categoria ou superior; d) locais que possam receber mais de 200 pessoas (detetados pelo efetivo dos espaços ou indicados à mão). Específicas: sala de condomínio > 200 m² (art. 210.º n.º 6 e)); UT VII rural da 2.ª categoria dispensada (art. 257.º); plataformas com tração elétrica sem meios com água (art. 273.º n.º 1); parques de campismo da 2.ª categoria ou superior (art. 286.º n.º 1 b)). Um só cálculo (engine/ria.ts) para o passo «Extintores», o Estudo, o relatório e as medidas exigíveis.
- **Mínimo de bocas (art. 165.º):** por piso, o maior entre a cobertura e as bocas obrigatórias junto às escadas (c)) e às saídas de locais > 200 pessoas (d)).
- ⚠️ **Cobertura — critério técnico:** cada boca conta com o quadrado inscrito no círculo de alcance (mangueira + 5 m), ou seja 2·(L+5)² m². A lei exige que todos os pontos fiquem a ≤ 5 m da agulheta e bocas a ≤ 2 L entre si (a) e b)); isso só se confirma na planta. Declarado no ecrã e nos documentos como mínimo.
- **Caudal (art. 167.º):** 1,5 l/s por boca com metade das bocas abertas (máximo 4), K ≥ 42; 1 l/s com K = 64 na alimentação pela rede pública com garantias (1.ª e 2.ª categorias, n.os 3 e 5). Alimentação conforme os n.os 4 a 6; regras de instalação do art. 166.º.
- **Projeto só de extintores:** a categoria não é calculada; o técnico indica a do projeto de SCIE ou da ficha de segurança (campo obrigatório para decidir a), b) e c)); os documentos dizem que foi indicada e não calculada. A alínea d) aplica-se mesmo sem categoria.

---

## 9. Limitações conhecidas (para a tese)

1. A aplicação não substitui o juízo do técnico autor do projeto nem a apreciação da entidade competente.
2. A área útil dos espaços aproxima a área bruta que a lei usa em alguns limites (D-13).
3. «Nível de saída para o exterior» aproximado pelo plano de referência quando não há cotas (D-15).
4. Título VIII verificado pelo técnico, não calculado (D-29).
5. Dúvidas sobre o texto publicado: D-27 e D-31.
6. A aplicação tem de ser revista sempre que a legislação for alterada (D-32).
7. Validação com casos reais aprovados: por fazer.
8. Projetos de especialidade de SCIE (2.ª a 4.ª categorias) e peças desenhadas de projeto estão fora do âmbito; a ficha de segurança é gerada como dados a transcrever para o modelo da ANEPC (D-35).
