# Backend i18n

This module provides localised error messages for API responses using
[`nestjs-i18n`](https://github.com/toonvanstrijp/nestjs-i18n).

## How it works

1. Frontend sends `Accept-Language: uz` or `Accept-Language: ru` (or
   `x-lang: ru`, or `?lang=ru`) with each request.
2. `nestjs-i18n` resolvers (configured in `app.module.ts`) pick the language
   per request. Priority order:
   1. `?lang=` query parameter
   2. `x-lang` header
   3. `accept-language` header
3. `I18nService.t(key)` returns the localised string for the current request.

If the language is unknown or the key is missing, `nestjs-i18n` falls back
to the `fallbackLanguage` (currently `uz`).

## Translation files

```
apps/api/src/i18n/
  uz/
    common.json       UI strings, units, formats, greetings
    errors.json       generic error messages
    auth.json         login / password / token errors
    validation.json   field validation errors
  ru/                 (same structure, Russian translations)
```

Both languages MUST share identical key sets. CI will check this in a
later task.

## Adding new translations

1. Add the key to `uz/<namespace>.json`.
2. Add the **same** key to `ru/<namespace>.json` with the Russian translation.
3. Reference it from code as `<namespace>.<key>` (e.g. `errors.userNotFound`).

Nested keys use dot notation: `common.units.kilogram` resolves to `kg`.

## Usage in services / handlers

```typescript
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class MyService {
  constructor(private readonly i18n: I18nService) {}

  async doSomething(): Promise<Result<MyData>> {
    const found = await this.repo.findById(id);
    if (!found) {
      const msg = await this.i18n.t('errors.notFound');
      return Err(AppErr('NOT_FOUND', msg));
    }
    return Ok(found);
  }
}
```

For NestJS HTTP exceptions:

```typescript
const msg = await this.i18n.t('errors.userNotFound');
throw new NotFoundException(msg);
```

## Reference implementation

See `apps/api/src/modules/auth/application/commands/login.handler.ts` for
the canonical pattern. It demonstrates:

- Constructor injection of `I18nService`
- Mapping internal error codes (`AuthErrorCode`) to localised strings
- Preserving the `Result<T>` pattern (Rule 1 in `CLAUDE.md`) end-to-end

## Migration scope

The full migration of every handler from hardcoded Uzbek strings to
`I18nService.t()` is **out of scope** for the initial Task Group 3. Migrate
opportunistically when you already touch a handler for unrelated reasons.

## Testing

In unit tests, mock `I18nService` so tests stay deterministic without
loading translation JSON files:

```typescript
const i18n = {
  t: jest.fn().mockImplementation(async (key: string) => key),
  translate: jest.fn().mockImplementation(async (key: string) => key),
} as unknown as I18nService;

const handler = new MyHandler(repo, i18n);
// assertions can match the i18n key directly:
expect(result.error.message).toBe('errors.notFound');
```

## Frontend contract

The backend honours the `Accept-Language` request header the frontend
already sends. No additional frontend wiring is required for backend
localisation. Locales currently supported: `uz` (default) and `ru`.
