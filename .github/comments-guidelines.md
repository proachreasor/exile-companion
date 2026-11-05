# Comment guidelines

These rules apply to all comment work in this repository. Refine this file as the review process shows what works.

## Recommended agent

- Preferred model for comment generation and review: Claude Sonnet 5.5.
- This is a preference only. The rules below apply to any agent.

## Core principles

- Don't comment code that is already self-explanatory.
- Explain why something is implemented, not what it does.
- Preserve existing useful comments. Change a comment only if it is wrong or stale.
- Comment-only changes: never modify application logic.

## C# (XML documentation)

- Use `///` XML docs on public APIs when they add meaningful information.
- Don't restate the member name (for example, "Gets the name" on `Name`).
- Include `<param>`, `<returns>`, and `<exception>` only when they say something the signature doesn't.
- Use `<remarks>` for contracts that are not obvious from the signature.

## TypeScript

- Use TSDoc for exported APIs where appropriate, following the same "adds meaningful information" rule.

## Inline comments

Always document:

- Unusual behavior.
- Cancellation handling.
- Concurrency and locking (for example, why a `SemaphoreSlim` is used).
- Non-obvious architectural decisions (for example, composite `GameId:Id` keys, schema version migration).

Control flow:

- Every `switch` (or similar branching structure) has at least one comment explaining what it is trying to do.

Keep inline comments minimal: one short comment explaining intent beats a line-by-line narration.

## TODO comments

- Remove `// TODO:` comments whose work is already implemented. This applies to test files as well as application code (for example, step lists left above tests that are already written).
- Leave TODOs that describe work that is still outstanding, and flag them for the owner.
- If it's unclear whether a TODO is fully implemented, leave it and ask.
- New TODOs should say what is left to do and why.

## Examples

Avoid (restates the code):

```csharp
// Clear the collection
FavoriteIds.Clear();
```

Prefer (explains why):

```csharp
// Route on schema version: v1 needs migration to composite keys, v2 is already current.
switch (data.Version)
{
	// ...
}
```

## Review checklist

- [ ] Comment explains why, not what.
- [ ] Self-explanatory code is left uncommented.
- [ ] Switch statements and similar structures have an intent comment.
- [ ] Concurrency, cancellation, and unusual behavior are documented.
- [ ] Existing useful comments are preserved.
- [ ] Implemented TODOs are removed; outstanding TODOs are kept.
- [ ] No logic changes (build and tests still pass).
