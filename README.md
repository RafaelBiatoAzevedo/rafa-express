# RafaExpress 2.0

Reconstrução em React 19 + TypeScript + Vite. Interface responsiva azul, cartão RafaExpress preservado e redesenhado, catálogo, busca, categorias, filtros de ofertas, ordenação, detalhes, favoritos, sacola com quantidade e persistência local, e consulta de CEP.

## Executar

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
npm test
```

O build está em `dist/`. O `base: './'` permite hospedagem estática em subpastas, inclusive GitHub Pages. Não é necessário backend para a demonstração.

## Integrações verificadas em 13/11/2026

- **Mercado Livre:** o endpoint usado anteriormente (`GET /sites/MLB/search?q=notebook`) retornou **403** no teste sem autenticação. A documentação oficial atual apresenta chamadas com `Authorization: Bearer ACCESS_TOKEN`. Não existe substituição pública anônima garantida para a antiga busca. Referência: https://developers.mercadolivre.com.br/itens-e-buscas . A integração real exige aplicação registrada, OAuth, backend para guardar/renovar tokens e validação das permissões da conta. Tokens nunca devem ser colocados no frontend ou em variáveis `VITE_*`. O projeto não promete acesso autenticado que não foi testado.
- **Catálogo secundário: DummyJSON** (`GET /products?limit=0`), testado com HTTP **200**. https://dummyjson.com/docs/products . Os produtos são fictícios; os valores retornados são multiplicados por 5 para composição de preços ilustrativos em reais, sem representar cotação cambial ou oferta comercial. Busca e filtros são locais, com normalização de acentos, palavras em qualquer ordem e sinônimos em português para descoberta dos produtos em inglês. A busca global limpa os filtros de categoria, favoritos e ofertas. Em erro/timeout, um catálogo de reserva é apresentado com aviso explícito.
- **CEP: ViaCEP**, testado com HTTP **200** no CEP `01001000`. https://viacep.com.br/ . Substitui a Webmania, eliminando chaves e segredos que estavam no código antigo. A consulta valida 8 dígitos, trata CEP inexistente, indisponibilidade e timeout. Não calcula frete ou prazo.

As antigas credenciais Webmania foram removidas do código atual, mas podem existir no histórico Git; revogue-as na conta do provedor caso ainda estejam ativas.

## Limites da demonstração

Não há checkout financeiro, emissão de cartão, pedido real, cálculo de frete ou autenticação de usuário. A sacola salva uma seleção apenas neste navegador. O cartão é um conceito visual e o modal também exibe a arte original preservada em `public/creditCard.jpeg`.

Imagens de produtos: DummyJSON. Imagem de capa: Unsplash. Fontes: Google Fonts, com fallback local. A navegação usa seções e modais, sem depender de reescrita de rotas no servidor.
