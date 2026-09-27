# Atualização DALLAS

## Análise da arquitetura e decisões

O aplicativo usa Expo 57, React Native, serviços TypeScript, AsyncStorage e uma API Spring Boot. O onboarding registra a conta, salva preferências locais e gera treinos. A sessão ativa é mantida por `WorkoutSessionService`; o histórico usa `WorkoutLogService`. Perfil e feed já eram locais, sem endpoint de upload ou armazenamento de arquivos no backend.

A API de exercícios existente (`/api/exercises`) tinha 49 exercícios globais, mas o DTO não retornava imagens. O app supria essa lacuna com `curatedExercises.ts`, substituindo informações da API e criando IDs locais. O gerador e a aba Modelos também referenciavam slugs inexistentes. Portanto, apenas trocar o gerador não resolveria o problema.

O catálogo visual existente foi transferido para o seed da própria API, com `sourceId` e caminhos verificados na fonte `yuhonas/free-exercise-db`. Variantes ambíguas foram corrigidas: por exemplo, rosca com barra W agora usa EZ-Bar Curl e stiff com halteres tem nome específico. O seed preserva IDs existentes e ignora registros personalizados ao associar metadados. Não há uma segunda API nem geração de exercícios no cliente. O arquivo local redundante foi removido.

A documentação exigida foi consultada: [Expo 57](https://docs.expo.dev/versions/v57.0.0/), [ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/) e [SplashScreen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/). As dependências foram instaladas com `expo install`, e as APIs de arquivos foram verificadas nos tipos da versão instalada.

## Comportamento implementado

- Upper/Lower: 4 treinos; Anterior/Posterior: 4; PPLUL: 5; Full Body: 3.
- “Por mim”: nenhum treino, nenhuma grade automática e nenhuma consulta obrigatória ao catálogo.
- Séries/repetições substituem a pergunta de local, são validadas e persistidas nas preferências. Templates contêm somente intenções de movimento.
- A seleção resolve o exercício exato antes das variantes revisadas e equivalentes. Se não houver alternativa válida, a geração falha explicitamente, sem salvar um plano incompleto. Nome, ID, imagem e instruções são do registro escolhido.
- Os treinos são gravados localmente em lote, com IDs estáveis; a sincronização com a API usa criação idempotente para permitir retomadas sem duplicação. O onboarding só é marcado como concluído depois da gravação.
- A aba Modelos reutiliza o gerador. Seletores manuais oferecem o catálogo real com mídia. A criação de registros apenas por texto foi removida desses fluxos.
- Imagens são copiadas para cache durável por URL de origem: diretório de documentos no aplicativo nativo e Cache Storage na web. A geração verifica o carregamento das imagens principais antes de terminar. Nenhuma imagem substituta é associada silenciosamente.
- Cadastro e perfil têm seletor da galeria com preview. A foto é copiada para documentos no dispositivo; na web, o Blob fica no IndexedDB. AsyncStorage guarda apenas a referência. A preferência é vinculada ao usuário e resiste à atualização de autenticação/login. Nenhum campo de URL permanece.
- O resumo recebe identidade e métricas da sessão encerrada. O card preto/vermelho é capturado como PNG e persistido no feed, com proporção própria para evitar cortes. O autor é o usuário autenticado. O volume mantém a regra existente de séries válidas concluídas; a quantidade de séries realizadas inclui todas as categorias concluídas.
- Splash minimalista com a logo oficial intacta, acento vermelho discreto, fundo escuro, animação curta e respeito à redução de movimento. A splash nativa usa a mesma identidade.

## Verificações

- `npm test`: 11 testes passando (divisões, prescrição, alternativa inexistente, ausência de catálogo, offline, gravação/repetição, foto/autenticação, IDs inválidos e métricas).
- `npm run typecheck`: passou.
- `npm run build:web`: passou.
- `./backend/mvnw -f backend/pom.xml test -q`: 9 testes passando.
- O teste de saúde antigo esperava `ok`, mas o controlador já retornava `UP`. A expectativa foi corrigida, sem mudar a API. O teste de login também deixou de depender de uma ordem específica de execução.
- As 98 URLs de imagens do catálogo foram consultadas e retornaram conteúdo de imagem.
- Navegador Chrome em viewport mobile, com API Spring Boot/H2 local: onboarding nas cinco opções; inspeção dos IDs e prescrição persistidos; abertura dos treinos e carregamento das imagens; seleção de foto, preview, salvar e recarregar; registro de séries, conclusão, captura e postagem de imagem, recarregamento do feed; splash e transição.
- Não existe script/configuração de lint no projeto. Foi executado `git diff --check`.

## Implantação e limites

É necessário publicar o backend atualizado antes de usar a nova geração em uma instalação sem cache. A alteração de banco é uma coluna nullable `exercises.catalog_data`; o projeto já usa `spring.jpa.hibernate.ddl-auto=update`. O seed preenche os metadados dos exercícios existentes sem trocar seus IDs. Se a implantação usar migrations controladas, crie essa coluna como VARCHAR(30000) antes de subir o backend.

É necessário gerar um novo build nativo para incluir ImagePicker, FileSystem, ViewShot, Sharing e a configuração de splash/permissões. Não há emulador Android/iOS ou dispositivo conectado neste ambiente: galeria, permissões, captura, compartilhamento e reabertura nativos precisam de validação no aparelho. A validação de interface executada aqui foi na web.

Foto e feed continuam locais, como na arquitetura original. Persistem ao fechar/reabrir e ao autenticar novamente na mesma instalação; não sincronizam entre dispositivos e são removidos ao apagar dados/desinstalar o app. Não foi inventado um serviço remoto de upload.

Referências inválidas em treinos antigos não são convertidas em exercícios inventados: a execução pede que o usuário edite o treino e selecione o registro correto do catálogo. O histórico existente é preservado.

## Arquivos alterados

- `App.tsx`
- `app.json`
- `backend/src/main/java/com/fittreino/dto/request/WorkoutRequest.java`
- `backend/src/main/java/com/fittreino/dto/response/ExerciseDto.java`
- `backend/src/main/java/com/fittreino/model/CatalogExercise.java`
- `backend/src/main/java/com/fittreino/model/ExerciseEntity.java`
- `backend/src/main/java/com/fittreino/repository/ExerciseSeeder.java`
- `backend/src/main/java/com/fittreino/service/WorkoutService.java`
- `backend/src/main/resources/exercise-catalog.json`
- `backend/src/test/java/com/fittreino/BackendIntegrationTest.java`
- `docs/DALLAS_UPDATE.md`
- `package-lock.json`
- `package.json`
- `src/api/dto.ts`
- `src/api/workoutsApi.ts`
- `src/components/common/AvatarPicker.tsx`
- `src/components/common/ExercisePickerModal.tsx`
- `src/components/common/PersistedImage.tsx`
- `src/components/common/UserAvatar.tsx`
- `src/components/common/WorkoutShareCard.tsx`
- `src/components/exercise/ExerciseDetailModal.tsx`
- `src/components/exercise/ExerciseImage.tsx`
- `src/components/exercise/ExerciseMediaViewer.tsx`
- `src/components/workout/WorkoutSessionExerciseCard.tsx`
- `src/data/curatedExercises.ts` — removido; catálogo centralizado na API
- `src/data/workoutTemplates.ts`
- `src/hooks/useUser.ts`
- `src/models/Exercise.ts`
- `src/models/Post.ts`
- `src/models/UserTrainingPreferences.ts`
- `src/models/Workout.ts`
- `src/models/WorkoutSummary.ts`
- `src/navigation/types.ts`
- `src/screens/ActiveExerciseDetailScreen.tsx`
- `src/screens/CommunityScreen.tsx`
- `src/screens/ExerciseExecutionScreen.tsx`
- `src/screens/ExercisesScreen.tsx`
- `src/screens/ProfileScreen.tsx`
- `src/screens/WorkoutCompleteScreen.tsx`
- `src/screens/WorkoutDetailScreen.tsx`
- `src/screens/WorkoutFormScreen.tsx`
- `src/screens/WorkoutsScreen.tsx`
- `src/screens/entry/OnboardingScreen.tsx`
- `src/screens/entry/SplashScreen.tsx`
- `src/services/CommunityService.ts`
- `src/services/ExerciseMediaCache.ts`
- `src/services/ExerciseMediaCache.web.ts`
- `src/services/ExerciseService.ts`
- `src/services/MediaService.ts`
- `src/services/MediaService.web.ts`
- `src/services/UserService.ts`
- `src/services/WorkoutPlanGeneratorService.ts`
- `src/services/WorkoutService.ts`
- `src/services/WorkoutSessionService.ts`
- `src/storage/storage.ts`
- `tests/flows.test.cjs`
