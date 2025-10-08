You are an autonomous debugging and fixing agent.

ISSUES TO FIX:
- Test failures: Command failed: npm test
FAIL tests/e2e/matching-user-journey.test.ts
  ● Test suite failed to run

      [31mx[0m Expected ',', got '$'
         ,-[[36;1;4mE:\projects\jobfinders_mvp\tests\e2e\matching-user-journey.test.ts[0m:526:1]
     [2m523[0m |   }
     [2m524[0m | 
     [2m525[0m |   async function step_setupCompanyProfile() {
     [2m526[0m |     await page.goto(`${TEST_BASE_URL}/employer/profile`);
         : [35;1m                     ^[0m
     [2m527[0m | 
     [2m528[0m |     await page.fill('[data-testid="company-description"]', 'We are an innovative technology company focused on creating cutting-edge solutions.');
     [2m529[0m |     await page.fill('[data-testid="company-website"]', 'https://testcompany.com');
         `----


    Caused by:
        Syntax Error

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)

FAIL tests/ml/model-accuracy.test.ts
  ● Test suite failed to run

      [31mx[0m Expected ';', got ')'
         ,-[[36;1;4mE:\projects\jobfinders_mvp\src\lib\scoring\algorithms.ts[0m:849:1]
     [2m846[0m |     } else {
     [2m847[0m |       // Candidate salary is above job range
     [2m848[0m |       const excess = (candidateMin - jobMax) / candidateMin;
     [2m849[0m |       return Math.max(0, 1 - excess * 0.5));
         : [35;1m                                          ^[0m
     [2m850[0m |     }
     [2m851[0m |   }
     [2m852[0m | }
         `----


    Caused by:
        Syntax Error

    [0m [90m 19 |[39m   [33mLocationMatcher[39m[33m,[39m
     [90m 20 |[39m   [33mPreferencesMatcher[39m[33m,[39m
    [31m[1m>[22m[39m[90m 21 |[39m   [33mSalaryMatcher[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 22 |[39m } [36mfrom[39m [32m'@/lib/scoring/algorithms'[39m[33m;[39m
     [90m 23 |[39m [36mimport[39m { [33mExplanationGenerator[39m } [36mfrom[39m [32m'@/lib/scoring/explanations'[39m[33m;[39m
     [90m 24 |[39m [36mimport[39m { logger } [36mfrom[39m [32m'@/lib/logging/logger'[39m[33m;[39m[0m

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)
      at Object.<anonymous> (src/services/matching/scoring-engine.ts:21:21)
      at Object.<anonymous> (tests/ml/model-accuracy.test.ts:40:24)

FAIL __tests__/integration/resume-api.test.ts
  ● Test suite failed to run

    Cannot find module 'openai' from '__tests__/integration/resume-api.test.ts'

    [0m [90m 16 |[39m
     [90m 17 |[39m [90m// Mock OpenAI[39m
    [31m[1m>[22m[39m[90m 18 |[39m jest[33m.[39mmock([32m'openai'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 19 |[39m   [33mOpenAI[39m[33m:[39m jest[33m.[39mfn()[33m.[39mmockImplementation(() [33m=>[39m ({
     [90m 20 |[39m     chat[33m:[39m {
     [90m 21 |[39m       completions[33m:[39m {[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (__tests__/integration/resume-api.test.ts:18:6)

FAIL __tests__/integration/jobs-api.test.ts
  ● Test suite failed to run

    Cannot find module 'msw/node' from '__tests__/test-utils/server.ts'

    Require stack:
      __tests__/test-utils/server.ts
      __tests__/integration/jobs-api.test.ts

    [0m [90m 29 |[39m   [90m// Close the server after all tests[39m
     [90m 30 |[39m   afterAll(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 31 |[39m     testServer[33m.[39mclose()
     [90m    |[39m               [31m[1m^[22m[39m
     [90m 32 |[39m   })
     [90m 33 |[39m }
     [90m 34 |[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.<anonymous> (__tests__/test-utils/server.ts:31:15)
      at Object.<anonymous> (__tests__/integration/jobs-api.test.ts:6:17)

FAIL tests/saved-jobs/page.test.tsx
  ● SavedJobsPage › Authentication › redirects unauthenticated users to sign in

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Authentication › redirects non-seeker users to dashboard

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Authentication › renders page for authenticated seeker users

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Loading State › shows loading skeleton while fetching data

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Empty State › displays empty state when no saved jobs

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job List Display › displays saved jobs with correct information

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job List Display › displays job status badges correctly

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job List Display › displays remote policy badge for remote jobs

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Search and Filter Functionality › filters jobs by search term

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Search and Filter Functionality › filters jobs by status

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Search and Filter Functionality › sorts jobs by different criteria

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job Selection and Bulk Operations › allows selecting individual jobs

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job Selection and Bulk Operations › allows selecting all jobs

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job Management › opens edit dialog when edit is clicked

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job Management › removes job when remove is clicked

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Export Functionality › exports selected jobs as CSV

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Collection Management › opens create collection dialog

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Collection Management › creates new collection with valid data

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Error Handling › handles API errors gracefully

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Accessibility › has proper ARIA labels and roles

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Accessibility › supports keyboard navigation

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

FAIL __tests__/pages/jobs-page.test.tsx
  ● JobsPage › Basic Rendering › renders the jobs listing page with main elements

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Basic Rendering › renders the view toggle buttons

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Basic Rendering › renders filters sidebar

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Basic Rendering › renders search history component

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Search Functionality › allows users to type in the search input

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Search Functionality › triggers search when Enter key is pressed

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Search Functionality › triggers search when search button is clicked

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Search Functionality › displays loading state during search

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to set location filter

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to select category filter

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to set salary range

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to select experience level

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to toggle remote work filter

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to clear all filters

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Results Display › displays jobs when search results are available

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Results Display › displays empty state when no jobs found

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Results Display › displays error state when search fails

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Results Display › displays pagination when multiple pages exist

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › View Modes › allows users to switch between grid and list views

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Search History Integration › allows users to select from search history

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Active Filters Display › displays active filter badges

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Active Filters Display › allows users to remove individual filters

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Accessibility › has proper ARIA labels and roles

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Accessibility › supports keyboard navigation

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Error Handling › handles API errors gracefully

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Error Handling › allows retry after error

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Responsive Design › shows mobile filters button on small screens

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

FAIL __tests__/resume-builder/components/ResumeEditor.test.tsx
  ● Test suite failed to run

    Configuration error:

    Could not locate module @/hooks/use-resume-editor mapped as:
    E:\projects\jobfinders_mvp\src\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@\/(.*)$/": "E:\projects\jobfinders_mvp\src\$1"
      },
      "resolver": undefined
    }

    [0m [90m  7 |[39m [90m// Mock the hook[39m
     [90m  8 |[39m jest[33m.[39mmock([32m'@/hooks/use-real-time-suggestions'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m  9 |[39m jest[33m.[39mmock([32m'@/hooks/use-resume-editor'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 10 |[39m   useResumeEditor[33m:[39m () [33m=>[39m ({
     [90m 11 |[39m     resumeData[33m:[39m {
     [90m 12 |[39m       personal[33m:[39m {[0m

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/index.js:1117:17)
      at Object.mock (__tests__/resume-builder/components/ResumeEditor.test.tsx:9:6)

FAIL __tests__/resume-builder/services/suggestion-engine.test.ts
  ● Test suite failed to run

    Cannot find module 'openai' from '__tests__/resume-builder/services/suggestion-engine.test.ts'

    [0m [90m 2 |[39m
     [90m 3 |[39m [90m// Mock OpenAI[39m
    [31m[1m>[22m[39m[90m 4 |[39m jest[33m.[39mmock([32m'openai'[39m[33m,[39m () [33m=>[39m ({
     [90m   |[39m      [31m[1m^[22m[39m
     [90m 5 |[39m   [33mOpenAI[39m[33m:[39m jest[33m.[39mfn()[33m.[39mmockImplementation(() [33m=>[39m ({
     [90m 6 |[39m     chat[33m:[39m {
     [90m 7 |[39m       completions[33m:[39m {[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (__tests__/resume-builder/services/suggestion-engine.test.ts:4:6)

FAIL tests/api/saved-jobs/export/route.test.ts
  ● Test suite failed to run

    ReferenceError: Request is not defined

    [0m [90m 18 |[39m   }[33m,[39m
     [90m 19 |[39m   savedJob[33m:[39m {
    [31m[1m>[22m[39m[90m 20 |[39m     findMany[33m:[39m jest[33m.[39mfn()
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 21 |[39m   }
     [90m 22 |[39m }))
     [90m 23 |[39m[0m

      at Object.Request (node_modules/next/src/server/web/spec-extension/request.ts:14:34)
      at Object.<anonymous> (node_modules/next/server.js:2:16)
      at Object.<anonymous> (tests/api/saved-jobs/export/route.test.ts:20:17)

FAIL __tests__/resume-builder/services/batch-processor.test.ts
  ● Console

    console.error
      Error processing job batch_1759883960385_5jaqt2ozm: TypeError: Assignment to constant variable.
          at BatchProcessor.results [as processJob] (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:239:11)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at BatchProcessor.processJobs (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:220:7)

    [0m [90m 262 |[39m
     [90m 263 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 264 |[39m       console[33m.[39merror([32m`Error processing job ${job.id}:`[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 265 |[39m       job[33m.[39mstatus [33m=[39m [32m'failed'[39m[33m;[39m
     [90m 266 |[39m       job[33m.[39merror [33m=[39m error [36minstanceof[39m [33mError[39m [33m?[39m error[33m.[39mmessage [33m:[39m [32m'Unknown error'[39m[33m;[39m
     [90m 267 |[39m       job[33m.[39mcompletedAt [33m=[39m [36mnew[39m [33mDate[39m()[33m;[39m[0m

      at BatchProcessor.error [as processJob] (src/services/resume-builder/batch-processor.ts:264:15)
      at BatchProcessor.processJobs (src/services/resume-builder/batch-processor.ts:220:7)

    console.error
      Error processing job batch_1759883960444_ks49jwxlj: TypeError: Assignment to constant variable.
          at BatchProcessor.results [as processJob] (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:242:11)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at BatchProcessor.processJobs (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:220:7)

    [0m [90m 262 |[39m
     [90m 263 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 264 |[39m       console[33m.[39merror([32m`Error processing job ${job.id}:`[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 265 |[39m       job[33m.[39mstatus [33m=[39m [32m'failed'[39m[33m;[39m
     [90m 266 |[39m       job[33m.[39merror [33m=[39m error [36minstanceof[39m [33mError[39m [33m?[39m error[33m.[39mmessage [33m:[39m [32m'Unknown error'[39m[33m;[39m
     [90m 267 |[39m       job[33m.[39mcompletedAt [33m=[39m [36mnew[39m [33mDate[39m()[33m;[39m[0m

      at BatchProcessor.error [as processJob] (src/services/resume-builder/batch-processor.ts:264:15)
      at BatchProcessor.processJobs (src/services/resume-builder/batch-processor.ts:220:7)

    console.error
      Error processing job batch_1759883960450_1zanlwm7r: TypeError: Assignment to constant variable.
          at BatchProcessor.results [as processJob] (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:248:11)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at BatchProcessor.processJobs (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:220:7)

    [0m [90m 262 |[39m
     [90m 263 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 264 |[39m       console[33m.[39merror([32m`Error processing job ${job.id}:`[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 265 |[39m       job[33m.[39mstatus [33m=[39m [32m'failed'[39m[33m;[39m
     [90m 266 |[39m       job[33m.[39merror [33m=[39m error [36minstanceof[39m [33mError[39m [33m?[39m error[33m.[39mmessage [33m:[39m [32m'Unknown error'[39m[33m;[39m
     [90m 267 |[39m       job[33m.[39mcompletedAt [33m=[39m [36mnew[39m [33mDate[39m()[33m;[39m[0m

      at BatchProcessor.error [as processJob] (src/services/resume-builder/batch-processor.ts:264:15)
      at BatchProcessor.processJobs (src/services/resume-builder/batch-processor.ts:220:7)

    console.error
      Error processing job batch_1759883960496_vamuvxf9q: TypeError: Assignment to constant variable.
          at BatchProcessor.results [as processJob] (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:239:11)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at BatchProcessor.processJobs (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:220:7)

    [0m [90m 262 |[39m
     [90m 263 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 264 |[39m       console[33m.[39merror([32m`Error processing job ${job.id}:`[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 265 |[39m       job[33m.[39mstatus [33m=[39m [32m'failed'[39m[33m;[39m
     [90m 266 |[39m       job[33m.[39merror [33m=[39m error [36minstanceof[39m [33mError[39m [33m?[39m error[33m.[39mmessage [33m:[39m [32m'Unknown error'[39m[33m;[39m
     [90m 267 |[39m       job[33m.[39mcompletedAt [33m=[39m [36mnew[39m [33mDate[39m()[33m;[39m[0m

      at BatchProcessor.error [as processJob] (src/services/resume-builder/batch-processor.ts:264:15)
      at BatchProcessor.processJobs (src/services/resume-builder/batch-processor.ts:220:7)

    console.error
      Error processing job batch_1759883960499_lmc8dmk57: TypeError: Assignment to constant variable.
          at BatchProcessor.results [as processJob] (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:239:11)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at BatchProcessor.processJobs (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:220:7)

    [0m [90m 262 |[39m
     [90m 263 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 264 |[39m       console[33m.[39merror([32m`Error processing job ${job.id}:`[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 265 |[39m       job[33m.[39mstatus [33m=[39m [32m'failed'[39m[33m;[39m
     [90m 266 |[39m       job[33m.[39merror [33m=[39m error [36minstanceof[39m [33mError[39m [33m?[39m error[33m.[39mmessage [33m:[39m [32m'Unknown error'[39m[33m;[39m
     [90m 267 |[39m       job[33m.[39mcompletedAt [33m=[39m [36mnew[39m [33mDate[39m()[33m;[39m[0m

      at BatchProcessor.error [as processJob] (src/services/resume-builder/batch-processor.ts:264:15)
      at BatchProcessor.processJobs (src/services/resume-builder/batch-processor.ts:220:7)

    console.error
      Error processing job batch_1759883960502_o53ss4af9: TypeError: Assignment to constant variable.
          at BatchProcessor.results [as processJob] (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:239:11)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at BatchProcessor.processJobs (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:220:7)

    [0m [90m 262 |[39m
     [90m 263 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 264 |[39m       console[33m.[39merror([32m`Error processing job ${job.id}:`[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 265 |[39m       job[33m.[39mstatus [33m=[39m [32m'failed'[39m[33m;[39m
     [90m 266 |[39m       job[33m.[39merror [33m=[39m error [36minstanceof[39m [33mError[39m [33m?[39m error[33m.[39mmessage [33m:[39m [32m'Unknown error'[39m[33m;[39m
     [90m 267 |[39m       job[33m.[39mcompletedAt [33m=[39m [36mnew[39m [33mDate[39m()[33m;[39m[0m

      at BatchProcessor.error [as processJob] (src/services/resume-builder/batch-processor.ts:264:15)
      at BatchProcessor.processJobs (src/services/resume-builder/batch-processor.ts:220:7)

    console.error
      Error processing job batch_1759883960618_jx3hy8m2d: TypeError: Assignment to constant variable.
          at BatchProcessor.results [as processJob] (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:239:11)
          at BatchProcessor.processJobs (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:220:7)

    [0m [90m 262 |[39m
     [90m 263 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 264 |[39m       console[33m.[39merror([32m`Error processing job ${job.id}:`[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 265 |[39m       job[33m.[39mstatus [33m=[39m [32m'failed'[39m[33m;[39m
     [90m 266 |[39m       job[33m.[39merror [33m=[39m error [36minstanceof[39m [33mError[39m [33m?[39m error[33m.[39mmessage [33m:[39m [32m'Unknown error'[39m[33m;[39m
     [90m 267 |[39m       job[33m.[39mcompletedAt [33m=[39m [36mnew[39m [33mDate[39m()[33m;[39m[0m

      at BatchProcessor.error [as processJob] (src/services/resume-builder/batch-processor.ts:264:15)
      at BatchProcessor.processJobs (src/services/resume-builder/batch-processor.ts:220:7)

    console.error
      Error processing job batch_1759883960740_sabvib29t: TypeError: Assignment to constant variable.
          at BatchProcessor.results [as processJob] (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:239:11)
          at BatchProcessor.processJobs (E:\projects\jobfinders_mvp\src\services\resume-builder\batch-processor.ts:220:7)

    [0m [90m 262 |[39m
     [90m 263 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 264 |[39m       console[33m.[39merror([32m`Error processing job ${job.id}:`[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 265 |[39m       job[33m.[39mstatus [33m=[39m [32m'failed'[39m[33m;[39m
     [90m 266 |[39m       job[33m.[39merror [33m=[39m error [36minstanceof[39m [33mError[39m [33m?[39m error[33m.[39mmessage [33m:[39m [32m'Unknown error'[39m[33m;[39m
     [90m 267 |[39m       job[33m.[39mcompletedAt [33m=[39m [36mnew[39m [33mDate[39m()[33m;[39m[0m

      at BatchProcessor.error [as processJob] (src/services/resume-builder/batch-processor.ts:264:15)
      at BatchProcessor.processJobs (src/services/resume-builder/batch-processor.ts:220:7)

  ● BatchProcessor › createJob › should create a batch job for resume analysis

    expect(received).toBe(expected) // Object.is equality

    Expected: "queued"
    Received: "processing"

    [0m [90m 67 |[39m       expect(job[33m.[39mid)[33m.[39mtoBeDefined()[33m;[39m
     [90m 68 |[39m       expect(job[33m.[39mtype)[33m.[39mtoBe([32m'resume_analysis'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 69 |[39m       expect(job[33m.[39mstatus)[33m.[39mtoBe([32m'queued'[39m)[33m;[39m
     [90m    |[39m                          [31m[1m^[22m[39m
     [90m 70 |[39m       expect(job[33m.[39mtotalItems)[33m.[39mtoBe([35m2[39m)[33m;[39m
     [90m 71 |[39m       expect(job[33m.[39mcreatedBy)[33m.[39mtoBe([32m'user-1'[39m)[33m;[39m
     [90m 72 |[39m       expect(job[33m.[39mmetadata[33m.[39mpriority)[33m.[39mtoBe([35m50[39m)[33m;[39m[0m

      at Object.toBe (__tests__/resume-builder/services/batch-processor.test.ts:69:26)

  ● BatchProcessor › cancelJob › should cancel a queued job

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

    [0m [90m 250 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m batchProcessor[33m.[39mcancelJob([32m'job-1'[39m[33m,[39m [32m'user-1'[39m)[33m;[39m
     [90m 251 |[39m
    [31m[1m>[22m[39m[90m 252 |[39m       expect(result)[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m     |[39m                      [31m[1m^[22m[39m
     [90m 253 |[39m     })[33m;[39m
     [90m 254 |[39m
     [90m 255 |[39m     it([32m'should not cancel job if user is not the owner'[39m[33m,[39m [36masync[39m () [33m=>[39m {[0m

      at Object.toBe (__tests__/resume-builder/services/batch-processor.test.ts:252:22)

  ● BatchProcessor › job processing › should process resume analysis jobs

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: {"certifications": [], "education": [], "experience": [], "languages": [], "professionalTitle": "Software Engineer", "projects": [], "resumeId": "resume-1", "summary": "Experienced developer"}

    Number of calls: 0

    [0m [90m 325 |[39m       [36mawait[39m [36mnew[39m [33mPromise[39m(resolve [33m=>[39m setTimeout(resolve[33m,[39m [35m100[39m))[33m;[39m
     [90m 326 |[39m
    [31m[1m>[22m[39m[90m 327 |[39m       expect(aiAnalyzer[33m.[39manalyzeResume)[33m.[39mtoHaveBeenCalledWith(mockResume)[33m;[39m
     [90m     |[39m                                        [31m[1m^[22m[39m
     [90m 328 |[39m     })[33m;[39m
     [90m 329 |[39m
     [90m 330 |[39m     it([32m'should handle processing errors'[39m[33m,[39m [36masync[39m () [33m=>[39m {[0m

      at Object.toHaveBeenCalledWith (__tests__/resume-builder/services/batch-processor.test.ts:327:40)

  ● BatchProcessor › job processing › should handle processing errors

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: ObjectContaining {"data": ObjectContaining {"error": StringContaining "AI service error", "status": "failed"}, "where": {"id": "job-1"}}
    Received
           1: {"data": {"completedAt": undefined, "error": undefined, "processedProfiles": 0, "progress": 0, "results": undefined, "startedAt": 2025-10-08T00:39:20.618Z, "status": "processing"}, "where": {"id": "batch_1759883960618_jx3hy8m2d"}}
           2: {"data": {"completedAt": 2025-10-08T00:39:20.620Z, "error": "Assignment to constant variable.", "processedProfiles": 0, "progress": 0, "results": undefined, "startedAt": 2025-10-08T00:39:20.618Z, "status": "failed"}, "where": {"id": "batch_1759883960618_jx3hy8m2d"}}

    Number of calls: 2

    [0m [90m 359 |[39m
     [90m 360 |[39m       [90m// Job should be marked as failed[39m
    [31m[1m>[22m[39m[90m 361 |[39m       expect(prisma[33m.[39mbatchMatchJob[33m.[39mupdate)[33m.[39mtoHaveBeenCalledWith(
     [90m     |[39m                                           [31m[1m^[22m[39m
     [90m 362 |[39m         expect[33m.[39mobjectContaining({
     [90m 363 |[39m           where[33m:[39m { id[33m:[39m [32m'job-1'[39m }[33m,[39m
     [90m 364 |[39m           data[33m:[39m expect[33m.[39mobjectContaining({[0m

      at Object.toHaveBeenCalledWith (__tests__/resume-builder/services/batch-processor.test.ts:361:43)

  ● BatchProcessor › integration tests › should handle complete job lifecycle

    expect(received).toBe(expected) // Object.is equality

    Expected: "queued"
    Received: "processing"

    [0m [90m 389 |[39m
     [90m 390 |[39m       [36mconst[39m job [33m=[39m [36mawait[39m batchProcessor[33m.[39mcreateJob(request)[33m;[39m
    [31m[1m>[22m[39m[90m 391 |[39m       expect(job[33m.[39mstatus)[33m.[39mtoBe([32m'queued'[39m)[33m;[39m
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 392 |[39m
     [90m 393 |[39m       [90m// 2. Get job status[39m
     [90m 394 |[39m       (prisma[33m.[39mbatchMatchJob[33m.[39mfindUnique [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockResolvedValue({[0m

      at Object.toBe (__tests__/resume-builder/services/batch-processor.test.ts:391:26)

FAIL tests/api/saved-jobs/[id]/route.test.ts
  ● Test suite failed to run

    ReferenceError: Request is not defined

    [0m [90m 20 |[39m     findUnique[33m:[39m jest[33m.[39mfn()[33m,[39m
     [90m 21 |[39m     update[33m:[39m jest[33m.[39mfn()[33m,[39m
    [31m[1m>[22m[39m[90m 22 |[39m     [36mdelete[39m[33m:[39m jest[33m.[39mfn()
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 23 |[39m   }
     [90m 24 |[39m }))
     [90m 25 |[39m[0m

      at Object.Request (node_modules/next/src/server/web/spec-extension/request.ts:14:34)
      at Object.<anonymous> (node_modules/next/server.js:2:16)
      at Object.<anonymous> (tests/api/saved-jobs/[id]/route.test.ts:22:17)

FAIL tests/api/saved-jobs/route.test.ts
  ● Test suite failed to run

    ReferenceError: Request is not defined

    [0m [90m 23 |[39m   }[33m,[39m
     [90m 24 |[39m   job[33m:[39m {
    [31m[1m>[22m[39m[90m 25 |[39m     findUnique[33m:[39m jest[33m.[39mfn()
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 26 |[39m   }
     [90m 27 |[39m }))
     [90m 28 |[39m[0m

      at Object.Request (node_modules/next/src/server/web/spec-extension/request.ts:14:34)
      at Object.<anonymous> (node_modules/next/server.js:2:16)
      at Object.<anonymous> (tests/api/saved-jobs/route.test.ts:25:17)

FAIL src/app/saved/__tests__/page.test.tsx
  ● SavedJobsPage › should render saved jobs page correctly

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:70:11)

  ● SavedJobsPage › should display saved jobs

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:79:11)

  ● SavedJobsPage › should show empty state when no saved jobs

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:93:11)

  ● SavedJobsPage › should show loading state

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:105:11)

  ● SavedJobsPage › should show error state

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:116:11)

  ● SavedJobsPage › should filter jobs by search term

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:123:11)

  ● SavedJobsPage › should filter jobs by status

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:133:11)

  ● SavedJobsPage › should sort jobs

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:143:11)

  ● SavedJobsPage › should select jobs for bulk operations

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:154:11)

  ● SavedJobsPage › should select all jobs

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:163:11)

  ● SavedJobsPage › should handle job removal

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:178:11)

  ● SavedJobsPage › should handle job editing

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:198:11)

  ● SavedJobsPage › should export jobs

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:229:11)

  ● SavedJobsPage › should create new collection

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:248:11)

  ● SavedJobsPage › should redirect non-seeker users

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "/dashboard"

    Number of calls: 0

    [0m [90m 282 |[39m     render([33m<[39m[33mSavedJobsPage[39m [33m/[39m[33m>[39m)
     [90m 283 |[39m
    [31m[1m>[22m[39m[90m 284 |[39m     expect(mockPush)[33m.[39mtoHaveBeenCalledWith([32m'/dashboard'[39m)
     [90m     |[39m                      [31m[1m^[22m[39m
     [90m 285 |[39m   })
     [90m 286 |[39m
     [90m 287 |[39m   it([32m'should redirect unauthenticated users'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toHaveBeenCalledWith (src/app/saved/__tests__/page.test.tsx:284:22)

  ● SavedJobsPage › should redirect unauthenticated users

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "/auth/signin"

    Number of calls: 0

    [0m [90m 300 |[39m     render([33m<[39m[33mSavedJobsPage[39m [33m/[39m[33m>[39m)
     [90m 301 |[39m
    [31m[1m>[22m[39m[90m 302 |[39m     expect(mockPush)[33m.[39mtoHaveBeenCalledWith([32m'/auth/signin'[39m)
     [90m     |[39m                      [31m[1m^[22m[39m
     [90m 303 |[39m   })
     [90m 304 |[39m
     [90m 305 |[39m   it([32m'should display job status badges'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toHaveBeenCalledWith (src/app/saved/__tests__/page.test.tsx:302:22)

  ● SavedJobsPage › should display job status badges

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:306:11)

  ● SavedJobsPage › should display job notes

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:313:11)

  ● SavedJobsPage › should clear filters

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:319:11)

  ● SavedJobsPage › should have responsive design

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:331:11)

FAIL src/hooks/__tests__/use-saved-jobs.test.ts
  ● Console

    console.error
      Error fetching saved jobs: TypeError: Cannot read properties of undefined (reading 'ok')
          at ok (E:\projects\jobfinders_mvp\src\hooks\use-saved-jobs.ts:40:21)
          at Object.toggleSave (E:\projects\jobfinders_mvp\src\hooks\use-saved-jobs.ts:94:9)
          at E:\projects\jobfinders_mvp\src\hooks\__tests__\use-saved-jobs.test.ts:106:7

    [0m [90m 47 |[39m       [36mconst[39m errorMessage [33m=[39m err [36minstanceof[39m [33mError[39m [33m?[39m err[33m.[39mmessage [33m:[39m [32m'Failed to fetch saved jobs'[39m
     [90m 48 |[39m       setError(errorMessage)
    [31m[1m>[22m[39m[90m 49 |[39m       console[33m.[39merror([32m'Error fetching saved jobs:'[39m[33m,[39m err)
     [90m    |[39m               [31m[1m^[22m[39m
     [90m 50 |[39m     } [36mfinally[39m {
     [90m 51 |[39m       setLoading([36mfalse[39m)
     [90m 52 |[39m     }[0m

      at error (src/hooks/use-saved-jobs.ts:49:15)
      at Object.toggleSave (src/hooks/use-saved-jobs.ts:94:9)
      at src/hooks/__tests__/use-saved-jobs.test.ts:106:7

    console.error
      Error fetching saved jobs: Error: Failed to fetch saved jobs
          at E:\projects\jobfinders_mvp\src\hooks\use-saved-jobs.ts:41:15

    [0m [90m 47 |[39m       [36mconst[39m errorMessage [33m=[39m err [36minstanceof[39m [33mError[39m [33m?[39m err[33m.[39mmessage [33m:[39m [32m'Failed to fetch saved jobs'[39m
     [90m 48 |[39m       setError(errorMessage)
    [31m[1m>[22m[39m[90m 49 |[39m       console[33m.[39merror([32m'Error fetching saved jobs:'[39m[33m,[39m err)
     [90m    |[39m               [31m[1m^[22m[39m
     [90m 50 |[39m     } [36mfinally[39m {
     [90m 51 |[39m       setLoading([36mfalse[39m)
     [90m 52 |[39m     }[0m

      at error (src/hooks/use-saved-jobs.ts:49:15)

  ● useSavedJobs › should handle unsave job correctly

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "/api/saved-jobs/1", {"method": "DELETE"}
    Received
           1: "/api/saved-jobs"
           2
              "/api/saved-jobs/1",
              Object {
            +   "headers": Object {
            +     "Content-Type": "application/json",
            +   },
                "method": "DELETE",
              },

    Number of calls: 2

    [0m [90m 152 |[39m     })
     [90m 153 |[39m
    [31m[1m>[22m[39m[90m 154 |[39m     expect(fetch)[33m.[39mtoHaveBeenCalledWith([32m'/api/saved-jobs/1'[39m[33m,[39m {
     [90m     |[39m                   [31m[1m^[22m[39m
     [90m 155 |[39m       method[33m:[39m [32m'DELETE'[39m
     [90m 156 |[39m     })
     [90m 157 |[39m[0m

      at Object.toHaveBeenCalledWith (src/hooks/__tests__/use-saved-jobs.test.ts:154:19)

  ● useSavedJobs › should handle API errors gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: "Failed to fetch"
    Received: "Failed to fetch saved jobs"

    [0m [90m 245 |[39m     })
     [90m 246 |[39m
    [31m[1m>[22m[39m[90m 247 |[39m     expect(result[33m.[39mcurrent[33m.[39merror)[33m.[39mtoBe([32m'Failed to fetch'[39m)
     [90m     |[39m                                  [31m[1m^[22m[39m
     [90m 248 |[39m     expect(mockToast[33m.[39mtoast)[33m.[39mnot[33m.[39mtoHaveBeenCalled()
     [90m 249 |[39m   })
     [90m 250 |[39m[0m

      at Object.toBe (src/hooks/__tests__/use-saved-jobs.test.ts:247:34)

  ● useSavedJobs › should export saved jobs

    Target container is not a DOM element.

    [0m [90m 282 |[39m     global[33m.[39mdocument[33m.[39mbody[33m.[39mremoveChild [33m=[39m jest[33m.[39mfn()
     [90m 283 |[39m
    [31m[1m>[22m[39m[90m 284 |[39m     [36mconst[39m { result } [33m=[39m renderHook(() [33m=>[39m useSavedJobs())
     [90m     |[39m                                  [31m[1m^[22m[39m
     [90m 285 |[39m
     [90m 286 |[39m     [36mawait[39m waitFor(() [33m=>[39m {
     [90m 287 |[39m       expect(result[33m.[39mcurrent[33m.[39msavedJobs)[33m.[39mtoEqual(mockJobs)[0m

      at Object.process.env.NODE_ENV.exports.createRoot (node_modules/react-dom/cjs/react-dom-client.development.js:24881:15)
      at createConcurrentRoot (node_modules/@testing-library/react/dist/pure.js:147:27)
      at render (node_modules/@testing-library/react/dist/pure.js:266:12)
      at renderHook (node_modules/@testing-library/react/dist/pure.js:340:7)
      at Object.<anonymous> (src/hooks/__tests__/use-saved-jobs.test.ts:284:34)

FAIL src/__tests__/applications.test.tsx
  ● Test suite failed to run

      [31mx[0m Unexpected token `ApplicationsPage`. Expected jsx identifier
         ,-[[36;1;4mE:\projects\jobfinders_mvp\src\__tests__\applications.test.tsx[0m:224:1]
     [2m221[0m |       status: 'unauthenticated',
     [2m222[0m |     })
     [2m223[0m | 
     [2m224[0m |     render(<ApplicationsPage>)
         : [35;1m            ^^^^^^^^^^^^^^^^[0m
     [2m225[0m | 
     [2m226[0m |     expect(mockPush).toHaveBeenCalledWith('/auth/signin')
     [2m227[0m |   })
         `----


    Caused by:
        Syntax Error

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)

FAIL tests/performance/matching-load.test.ts (6.567 s)
  ● Matching System Load Testing › API Endpoint Performance › should handle concurrent matching requests

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › API Endpoint Performance › should handle batch matching operations

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › API Endpoint Performance › should handle recommendation requests

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › API Endpoint Performance › should handle profile analysis requests

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Database Performance › should handle concurrent database operations

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Database Performance › should handle complex query operations

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Cache Performance › should handle high cache hit rates

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Cache Performance › should handle cache misses gracefully

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Memory and Resource Usage › should maintain stable memory usage under load

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Scalability Tests › should scale linearly with increased load

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Scalability Tests › should handle sustained load without degradation

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)


  ● Test suite failed to run

    ReferenceError: setImmediate is not defined

    [0m [90m 48 |[39m
     [90m 49 |[39m   afterAll([36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 50 |[39m     [36mawait[39m prisma[33m.[39m$disconnect()[33m;[39m
     [90m    |[39m     [31m[1m^[22m[39m
     [90m 51 |[39m   })[33m;[39m
     [90m 52 |[39m
     [90m 53 |[39m   describe([32m'API Endpoint Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at node_modules/@prisma/client/src/runtime/core/engines/library/LibraryEngine.ts:469:32
      at r (node_modules/@prisma/client/src/runtime/core/engines/library/LibraryEngine.ts:469:13)
      at Object.callback [as runInChildSpan] (node_modules/@prisma/client/src/runtime/core/tracing/TracingHelper.ts:24:12)
      at Co.runInChildSpan (node_modules/@prisma/client/src/runtime/core/tracing/TracingHelper.ts:49:42)
      at Gr.stop (node_modules/@prisma/client/src/runtime/core/engines/library/LibraryEngine.ts:495:54)
      at Proxy.$disconnect (node_modules/@prisma/client/src/runtime/getPrismaClient.ts:473:9)
      at Object.<anonymous> (tests/performance/matching-load.test.ts:50:5)

FAIL src/components/jobs/__tests__/job-card.test.tsx
  ● Console

    console.error
      Error toggling save: Error: Failed to save job
          at handleToggleSave (E:\projects\jobfinders_mvp\src\components\jobs\job-card.tsx:66:17)

    [0m [90m 77 |[39m       }
     [90m 78 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 79 |[39m       console[33m.[39merror([32m'Error toggling save:'[39m[33m,[39m error)
     [90m    |[39m               [31m[1m^[22m[39m
     [90m 80 |[39m       toast({
     [90m 81 |[39m         title[33m:[39m [32m"Error"[39m[33m,[39m
     [90m 82 |[39m         description[33m:[39m error [36minstanceof[39m [33mError[39m [33m?[39m error[33m.[39mmessage [33m:[39m [32m"Failed to save job. Please try again."[39m[33m,[39m[0m

      at error (src/components/jobs/job-card.tsx:79:15)

  ● JobCard › should render job information correctly

    TestingLibraryElementError: Unable to find an element with the text: 500,000 - 800,000 ZAR. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

    Ignored nodes: comments, script, style
    [36m<body>[39m
      [36m<div>[39m
        [36m<div[39m
          [33mclass[39m=[32m"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm p-6 hover:border-primary transition-colors"[39m
          [33mdata-slot[39m=[32m"card"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-start gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-12 h-12 relative flex-shrink-0"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"w-12 h-12 rounded-lg bg-muted flex items-center justify-center"[39m
              [36m>[39m
                [36m<svg[39m
                  [33maria-hidden[39m=[32m"true"[39m
                  [33mclass[39m=[32m"lucide lucide-building2 lucide-building-2 w-6 h-6 text-muted-foreground"[39m
                  [33mfill[39m=[32m"none"[39m
                  [33mheight[39m=[32m"24"[39m
                  [33mstroke[39m=[32m"currentColor"[39m
                  [33mstroke-linecap[39m=[32m"round"[39m
                  [33mstroke-linejoin[39m=[32m"round"[39m
                  [33mstroke-width[39m=[32m"2"[39m
                  [33mviewBox[39m=[32m"0 0 24 24"[39m
                  [33mwidth[39m=[32m"24"[39m
                  [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
                [36m>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M10 6h4"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M10 10h4"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M10 14h4"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M10 18h4"[39m
                  [36m/>[39m
                [36m</svg>[39m
              [36m</div>[39m
            [36m</div>[39m
            [36m<div[39m
              [33mclass[39m=[32m"flex-grow"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-start justify-between gap-4"[39m
              [36m>[39m
                [36m<div>[39m
                  [36m<a[39m
                    [33mhref[39m=[32m"/jobs/1"[39m
                  [36m>[39m
                    [0mSoftware Developer[0m
                  [36m</a>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"flex items-center gap-2 text-muted-foreground"[39m
                  [36m>[39m
                    [36m<span[39m
                      [33mclass[39m=[32m"flex items-center gap-1"[39m
                    [36m>[39m
                      [36m<svg[39m
                        [33maria-hidden[39m=[32m"true"[39m
                        [33mclass[39m=[32m"lucide lucide-building2 lucide-building-2 w-4 h-4"[39m
                        [33mfill[39m=[32m"none"[39m
                        [33mheight[39m=[32m"24"[39m
                        [33mstroke[39m=[32m"currentColor"[39m
                        [33mstroke-linecap[39m=[32m"round"[39m
                        [33mstroke-linejoin[39m=[32m"round"[39m
                        [33mstroke-width[39m=[32m"2"[39m
                        [33mviewBox[39m=[32m"0 0 24 24"[39m
                        [33mwidth[39m=[32m"24"[39m
                        [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
                      [36m>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M10 6h4"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M10 10h4"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M10 14h4"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M10 18h4"[39m
                        [36m/>[39m
                      [36m</svg>[39m
                      [0mTech Company[0m
                    [36m</span>[39m
                    [36m<span[39m
                      [33mclass[39m=[32m"inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent [a&]:hover:bg-secondary/90 bg-blue-100 text-blue-800"[39m
                      [33mdata-slot[39m=[32m"badge"[39m
                    [36m>[39m
                      [0mVerified[0m
                    [36m</span>[39m
                  [36m</div>[39m
                [36m</div>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground hidden sm:flex"[39m
                  [33mdata-slot[39m=[32m"badge"[39m
                  [33mstyle[39m=[32m"background-color: rgb(59, 130, 246); color: rgb(255, 255, 255);"[39m
                [36m>[39m
                  [36m<span[39m
                    [33mclass[39m=[32m"mr-1"[39m
                  [36m>[39m
                    [0m💻[0m
                  [36m</span>[39m
                  [0mEngineering[0m
                [36m</span>[39m
              [36m</div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"flex items-center gap-1"[39m
                [36m>[39m
                  [36m<svg[39m
                    [33maria-hidden[39m=[32m"true"[39m
                    [33mclass[39m=[32m"lucide lucide-map-pin w-4 h-4"[39m
                    [33mfill[39m=[32m"none"[39m
            ...

    [0m [90m 76 |[39m     expect(screen[33m.[39mgetByText([32m'15 applicants'[39m))[33m.[39mtoBeInTheDocument()
     [90m 77 |[39m     expect(screen[33m.[39mgetByText([32m'Mid-level'[39m))[33m.[39mtoBeInTheDocument()
    [31m[1m>[22m[39m[90m 78 |[39m     expect(screen[33m.[39mgetByText([32m'500,000 - 800,000 ZAR'[39m))[33m.[39mtoBeInTheDocument()
     [90m    |[39m                   [31m[1m^[22m[39m
     [90m 79 |[39m   })
     [90m 80 |[39m
     [90m 81 |[39m   it([32m'should show bookmark button'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.getElementError (node_modules/@testing-library/dom/dist/config.js:37:19)
      at node_modules/@testing-library/dom/dist/query-helpers.js:76:38
      at node_modules/@testing-library/dom/dist/query-helpers.js:52:17
      at node_modules/@testing-library/dom/dist/query-helpers.js:95:19
      at Object.getByText (src/components/jobs/__tests__/job-card.test.tsx:78:19)

  ● JobCard › should handle unsave functionality when no onToggleSave provided

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    - Expected
    + Received

      "/api/saved-jobs/1",
      Object {
    +   "headers": Object {
    +     "Content-Type": "application/json",
    +   },
        "method": "DELETE",
      },

    Number of calls: 1

    Ignored nodes: comments, script, style
    [36m<html>[39m
      [36m<head />[39m
      [36m<body>[39m
        [36m<div>[39m
          [36m<div[39m
            [33mclass[39m=[32m"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm p-6 hover:border-primary transition-colors"[39m
            [33mdata-slot[39m=[32m"card"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"flex items-start gap-4"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"w-12 h-12 relative flex-shrink-0"[39m
              [36m>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-12 h-12 rounded-lg bg-muted flex items-center justify-center"[39m
                [36m>[39m
                  [36m<svg[39m
                    [33maria-hidden[39m=[32m"true"[39m
                    [33mclass[39m=[32m"lucide lucide-building2 lucide-building-2 w-6 h-6 text-muted-foreground"[39m
                    [33mfill[39m=[32m"none"[39m
                    [33mheight[39m=[32m"24"[39m
                    [33mstroke[39m=[32m"currentColor"[39m
                    [33mstroke-linecap[39m=[32m"round"[39m
                    [33mstroke-linejoin[39m=[32m"round"[39m
                    [33mstroke-width[39m=[32m"2"[39m
                    [33mviewBox[39m=[32m"0 0 24 24"[39m
                    [33mwidth[39m=[32m"24"[39m
                    [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
                  [36m>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M10 6h4"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M10 10h4"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M10 14h4"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M10 18h4"[39m
                    [36m/>[39m
                  [36m</svg>[39m
                [36m</div>[39m
              [36m</div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex-grow"[39m
              [36m>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"flex items-start justify-between gap-4"[39m
                [36m>[39m
                  [36m<div>[39m
                    [36m<a[39m
                      [33mhref[39m=[32m"/jobs/1"[39m
                    [36m>[39m
                      [0mSoftware Developer[0m
                    [36m</a>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex items-center gap-2 text-muted-foreground"[39m
                    [36m>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"flex items-center gap-1"[39m
                      [36m>[39m
                        [36m<svg[39m
                          [33maria-hidden[39m=[32m"true"[39m
                          [33mclass[39m=[32m"lucide lucide-building2 lucide-building-2 w-4 h-4"[39m
                          [33mfill[39m=[32m"none"[39m
                          [33mheight[39m=[32m"24"[39m
                          [33mstroke[39m=[32m"currentColor"[39m
                          [33mstroke-linecap[39m=[32m"round"[39m
                          [33mstroke-linejoin[39m=[32m"round"[39m
                          [33mstroke-width[39m=[32m"2"[39m
                          [33mviewBox[39m=[32m"0 0 24 24"[39m
                          [33mwidth[39m=[32m"24"[39m
                          [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
                        [36m>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M10 6h4"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M10 10h4"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M10 14h4"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M10 18h4"[39m
                          [36m/>[39m
                        [36m</svg>[39m
                        [0mTech Company[0m
                      [36m</span>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent [a&]:hover:bg-secondary/90 bg-blue-100 text-blue-800"[39m
                        [33mdata-slot[39m=[32m"badge"[39m
                      [36m>[39m
                        [0mVerified[0m
                      [36m</span>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                  [36m<span[39m
                    [33mclass[39m=[32m"items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground hidden sm:flex"[39m
                    [33mdata-slot[39m=[32m"badge"[39m
                    [33mstyle[39m=[32m"background-color: rgb(59, 130, 246); color: rgb(255, 255, 255);"[39m
                  [36m>[39m
                    [36m<span[39m
                      [33mclass[39m=[32m"mr-1"[39m
                    [36m>[39m
                      [0m💻[0m
                    [36m</span>[39m
                    [0mEngineering[0m
                  [36m</span>[39m
                [36m</div>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"[39m
                [36m>[39m
                  [36m<span[39m
      ...

    [0m [90m 142 |[39m
     [90m 143 |[39m     [36mawait[39m waitFor(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 144 |[39m       expect(fetch)[33m.[39mtoHaveBeenCalledWith([32m'/api/saved-jobs/1'[39m[33m,[39m {
     [90m     |[39m                     [31m[1m^[22m[39m
     [90m 145 |[39m         method[33m:[39m [32m'DELETE'[39m
     [90m 146 |[39m       })
     [90m 147 |[39m     })[0m

      at toHaveBeenCalledWith (src/components/jobs/__tests__/job-card.test.tsx:144:21)
      at runWithExpensiveErrorDiagnosticsDisabled (node_modules/@testing-library/dom/dist/config.js:47:12)
      at checkCallback (node_modules/@testing-library/dom/dist/wait-for.js:124:77)
      at checkRealTimersCallback (node_modules/@testing-library/dom/dist/wait-for.js:118:16)
      at Timeout.task [as _onTimeout] (node_modules/jsdom/lib/jsdom/browser/Window.js:579:19)


  ●  Cannot log after tests are done. Did you forget to wait for something async in your test?
    Attempted to log "Error setting up test data: [PrismaClientValidationError: 
    Invalid `prisma.candidateProfile.create()` invocation:

    {
      data: {
        id: "test-candidate-0",
        userId: "test-user-0",
        personalInfo: {
          firstName: "Test0",
          lastName: "Candidate0",
          email: "test0@example.com"
        },
        skills: [
          {
            name: "JavaScript",
            level: "EXPERT"
          },
          {
            name: "React",
            level: "ADVANCED"
          },
          {
            name: "Node.js",
            level: "INTERMEDIATE"
          }
        ],
        experience: [
          {
            title: "Software Engineer",
            company: "Test Corp",
            startDate: new Date("2020-01-01T00:00:00.000Z"),
            endDate: new Date("2023-12-31T00:00:00.000Z"),
            isCurrentJob: false,
            description: "Test experience",
            skills: [
              "JavaScript",
              "React"
            ],
            achievements: [
              "Test achievement"
            ]
          }
        ],
        completeness: 90,
        ~~~~~~~~~~~~
        lastUpdated: new Date("2025-10-08T00:39:18.656Z"),
    ?   professionalSummary?: String | Null,
    ?   education?: JsonNullValueInput | Json,
    ?   certifications?: JsonNullValueInput | Json,
    ?   preferences?: JsonNullValueInput | Json,
    ?   availability?: JsonNullValueInput | Json,
    ?   completionScore?: Int,
    ?   visibility?: String,
    ?   isActive?: Boolean,
    ?   isPublic?: Boolean,
    ?   allowSearch?: Boolean,
    ?   allowDirectContact?: Boolean,
    ?   anonymousMatching?: Boolean,
    ?   dataRetentionPeriod?: Int,
    ?   lastProfileView?: DateTime | Null,
    ?   profileViews?: Int,
    ?   searchRanking?: Float,
    ?   verificationStatus?: String,
    ?   createdAt?: DateTime,
    ?   updatedAt?: DateTime,
    ?   matchResults?: MatchResultUncheckedCreateNestedManyWithoutCandidateProfileInput,
    ?   profileEmbeddings?: ProfileEmbeddingUncheckedCreateNestedManyWithoutCandidateProfileInput
      }
    }

    Unknown argument `completeness`. Available options are marked with ?.] {
      clientVersion: '6.15.0'
    }".

    [0m [90m 782 |[39m     }[33m;[39m
     [90m 783 |[39m   }
    [31m[1m>[22m[39m[90m 784 |[39m
     [90m     |[39m [31m[1m^[22m[39m
     [90m 785 |[39m   [36masync[39m [36mfunction[39m runDatabaseLoadTest(config[33m:[39m {
     [90m 786 |[39m     name[33m:[39m string[33m;[39m
     [90m 787 |[39m     concurrentConnections[33m:[39m number[33m;[39m[0m

      at console.error (node_modules/@jest/console/build/index.js:124:10)
      at setupTestData (tests/performance/matching-load.test.ts:784:21)
      at Object.<anonymous> (tests/performance/matching-load.test.ts:27:9)

FAIL __tests__/hooks/useCurrentUser.test.ts
  ● useCurrentUser › Role-based Helpers › should correctly identify admin role

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

    [0m [90m 305 |[39m       [36mconst[39m { result } [33m=[39m renderHook(() [33m=>[39m useCurrentUser())
     [90m 306 |[39m
    [31m[1m>[22m[39m[90m 307 |[39m       expect(result[33m.[39mcurrent[33m.[39misJobSeeker)[33m.[39mtoBe([36mfalse[39m)
     [90m     |[39m                                          [31m[1m^[22m[39m
     [90m 308 |[39m       expect(result[33m.[39mcurrent[33m.[39misEmployer)[33m.[39mtoBe([36mfalse[39m)
     [90m 309 |[39m       expect(result[33m.[39mcurrent[33m.[39misAdmin)[33m.[39mtoBe([36mtrue[39m)
     [90m 310 |[39m     })[0m

      at Object.toBe (__tests__/hooks/useCurrentUser.test.ts:307:42)

PASS src/test/role-system.test.ts
FAIL src/services/notifications/__tests__/delivery-engine.test.ts
  ● Test suite failed to run

    Cannot find module 'bullmq' from 'src/lib/queue/event-queue.ts'

    [0m [90m 10 |[39m   concurrency[33m?[39m[33m:[39m number
     [90m 11 |[39m   maxRetries[33m?[39m[33m:[39m number
    [31m[1m>[22m[39m[90m 12 |[39m   retryDelay[33m?[39m[33m:[39m number
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 13 |[39m   removeOnComplete[33m?[39m[33m:[39m number
     [90m 14 |[39m   removeOnFail[33m?[39m[33m:[39m number
     [90m 15 |[39m }[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.<anonymous> (src/lib/queue/event-queue.ts:12:17)
      at Object.<anonymous> (src/services/notifications/delivery-engine.ts:21:21)
      at Object.<anonymous> (src/services/notifications/__tests__/delivery-engine.test.ts:10:25)

FAIL src/services/notifications/__tests__/channel-orchestrator.test.ts
  ● Test suite failed to run

      [31mx[0m Expected ';', '}' or <eof>
       ,-[[36;1;4mE:\projects\jobfinders_mvp\src\services\notifications\channel-orchestrator.ts[0m:1:1]
     [2m1[0m | dateimport { EventEmitter } from 'events'
       : [35;1m^^^^^|^^^^[0m[33;1m ^[0m
       :      [35;1m`-- [35;1mThis is the expression part of an expression statement[0m[0m
     [2m2[0m | import { db } from '@/lib/db'
     [2m3[0m | import { redis } from '@/lib/redis'
     [2m3[0m | import { EventQueueManager } from '@/lib/queue/event-queue'
       `----


    Caused by:
        Syntax Error

    [0m [90m 11 |[39m jest[33m.[39mmock([32m'../channels/email-channel'[39m)
     [90m 12 |[39m jest[33m.[39mmock([32m'../channels/sms-channel'[39m)
    [31m[1m>[22m[39m[90m 13 |[39m jest[33m.[39mmock([32m'../channels/push-channel'[39m)
     [90m    |[39m                              [31m[1m^[22m[39m
     [90m 14 |[39m jest[33m.[39mmock([32m'../channels/in-app-channel'[39m)
     [90m 15 |[39m jest[33m.[39mmock([32m'../analytics-engine'[39m)
     [90m 16 |[39m jest[33m.[39mmock([32m'@prisma/client'[39m)[0m

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)
      at Object.<anonymous> (src/services/notifications/__tests__/channel-orchestrator.test.ts:13:30)

FAIL tests/services/matching/scoring-engine.test.ts
  ● Test suite failed to run

      [31mx[0m Expected ';', got ')'
         ,-[[36;1;4mE:\projects\jobfinders_mvp\src\lib\scoring\algorithms.ts[0m:849:1]
     [2m846[0m |     } else {
     [2m847[0m |       // Candidate salary is above job range
     [2m848[0m |       const excess = (candidateMin - jobMax) / candidateMin;
     [2m849[0m |       return Math.max(0, 1 - excess * 0.5));
         : [35;1m                                          ^[0m
     [2m850[0m |     }
     [2m851[0m |   }
     [2m852[0m | }
         `----


    Caused by:
        Syntax Error

    [0m [90m 19 |[39m   [33mLocationMatcher[39m[33m,[39m
     [90m 20 |[39m   [33mPreferencesMatcher[39m[33m,[39m
    [31m[1m>[22m[39m[90m 21 |[39m   [33mSalaryMatcher[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 22 |[39m } [36mfrom[39m [32m'@/lib/scoring/algorithms'[39m[33m;[39m
     [90m 23 |[39m [36mimport[39m { [33mExplanationGenerator[39m } [36mfrom[39m [32m'@/lib/scoring/explanations'[39m[33m;[39m
     [90m 24 |[39m [36mimport[39m { logger } [36mfrom[39m [32m'@/lib/logging/logger'[39m[33m;[39m[0m

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)
      at Object.<anonymous> (src/services/matching/scoring-engine.ts:21:21)
      at Object.<anonymous> (tests/services/matching/scoring-engine.test.ts:24:24)

FAIL src/services/notifications/__tests__/email-channel.test.ts
  ● EmailChannelService › Single Email Sending › should send email successfully

    TypeError: emailService.send is not a function

    [0m [90m 81 |[39m       } [36mas[39m any)
     [90m 82 |[39m
    [31m[1m>[22m[39m[90m 83 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m emailService[33m.[39msend(payload)
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 84 |[39m
     [90m 85 |[39m       expect(result[33m.[39msuccess)[33m.[39mtoBe([36mtrue[39m)
     [90m 86 |[39m       expect(result[33m.[39mmessageId)[33m.[39mtoBe([32m'email-123'[39m)[0m

      at Object.send (src/services/notifications/__tests__/email-channel.test.ts:83:41)

  ● EmailChannelService › Single Email Sending › should handle suppressed recipients

    TypeError: emailService.send is not a function

    [0m [90m 112 |[39m       } [36mas[39m any)
     [90m 113 |[39m
    [31m[1m>[22m[39m[90m 114 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m emailService[33m.[39msend(payload)
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 115 |[39m
     [90m 116 |[39m       expect(result[33m.[39msuccess)[33m.[39mtoBe([36mfalse[39m)
     [90m 117 |[39m       expect(result[33m.[39merror)[33m.[39mtoContain([32m'suppressed'[39m)[0m

      at Object.send (src/services/notifications/__tests__/email-channel.test.ts:114:41)

  ● EmailChannelService › Single Email Sending › should handle template not found

    TypeError: emailService.send is not a function

    [0m [90m 134 |[39m       mockPrisma[33m.[39mnotificationTemplate[33m.[39mfindFirst[33m.[39mmockResolvedValue([36mnull[39m)
     [90m 135 |[39m
    [31m[1m>[22m[39m[90m 136 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m emailService[33m.[39msend(payload)
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 137 |[39m
     [90m 138 |[39m       expect(result[33m.[39msuccess)[33m.[39mtoBe([36mfalse[39m)
     [90m 139 |[39m       expect(result[33m.[39merror)[33m.[39mtoContain([32m'Template not found'[39m)[0m

      at Object.send (src/services/notifications/__tests__/email-channel.test.ts:136:41)

  ● EmailChannelService › Single Email Sending › should handle Resend API errors

    TypeError: emailService.send is not a function

    [0m [90m 167 |[39m       } [36mas[39m any)
     [90m 168 |[39m
    [31m[1m>[22m[39m[90m 169 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m emailService[33m.[39msend(payload)
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 170 |[39m
     [90m 171 |[39m       expect(result[33m.[39msuccess)[33m.[39mtoBe([36mfalse[39m)
     [90m 172 |[39m       expect(result[33m.[39merror)[33m.[39mtoContain([32m'Invalid email address'[39m)[0m

      at Object.send (src/services/notifications/__tests__/email-channel.test.ts:169:41)

  ● EmailChannelService › Bulk Email Sending › should send bulk emails successfully

    TypeError: emailService.sendBulk is not a function

    [0m [90m 208 |[39m         [33m.[39mmockResolvedValueOnce({ data[33m:[39m { id[33m:[39m [32m'email-2'[39m }[33m,[39m error[33m:[39m [36mnull[39m } [36mas[39m any)
     [90m 209 |[39m
    [31m[1m>[22m[39m[90m 210 |[39m       [36mconst[39m results [33m=[39m [36mawait[39m emailService[33m.[39msendBulk(payloads)
     [90m     |[39m                                          [31m[1m^[22m[39m
     [90m 211 |[39m
     [90m 212 |[39m       expect(results)[33m.[39mtoHaveLength([35m2[39m)
     [90m 213 |[39m       expect(results[33m.[39mevery(r [33m=>[39m r[33m.[39msuccess))[33m.[39mtoBe([36mtrue[39m)[0m

      at Object.sendBulk (src/services/notifications/__tests__/email-channel.test.ts:210:42)

  ● EmailChannelService › Bulk Email Sending › should handle partial failures in bulk sending

    TypeError: emailService.sendBulk is not a function

    [0m [90m 248 |[39m         [33m.[39mmockResolvedValueOnce({ data[33m:[39m [36mnull[39m[33m,[39m error[33m:[39m { message[33m:[39m [32m'Invalid email'[39m } } [36mas[39m any)
     [90m 249 |[39m
    [31m[1m>[22m[39m[90m 250 |[39m       [36mconst[39m results [33m=[39m [36mawait[39m emailService[33m.[39msendBulk(payloads)
     [90m     |[39m                                          [31m[1m^[22m[39m
     [90m 251 |[39m
     [90m 252 |[39m       expect(results)[33m.[39mtoHaveLength([35m2[39m)
     [90m 253 |[39m       expect(results[[35m0[39m][33m.[39msuccess)[33m.[39mtoBe([36mtrue[39m)[0m

      at Object.sendBulk (src/services/notifications/__tests__/email-channel.test.ts:250:42)

  ● EmailChannelService › Template Processing › should process template variables correctly

    TypeError: emailService.processTemplate is not a function

    [0m [90m 270 |[39m       }
     [90m 271 |[39m
    [31m[1m>[22m[39m[90m 272 |[39m       [36mconst[39m processed [33m=[39m emailService[[32m'processTemplate'[39m](template[33m,[39m variables)
     [90m     |[39m                                                        [31m[1m^[22m[39m
     [90m 273 |[39m
     [90m 274 |[39m       expect(processed[33m.[39msubject)[33m.[39mtoBe([32m'Welcome John to JobFinders!'[39m)
     [90m 275 |[39m       expect(processed[33m.[39mhtmlContent)[33m.[39mtoBe([32m'<h1>Hello John</h1><p>Welcome to our platform</p><p>Best regards, JobFinders</p>'[39m)[0m

      at Object.<anonymous> (src/services/notifications/__tests__/email-channel.test.ts:272:56)

  ● EmailChannelService › Template Processing › should handle missing template variables

    TypeError: emailService.processTemplate is not a function

    [0m [90m 289 |[39m       }
     [90m 290 |[39m
    [31m[1m>[22m[39m[90m 291 |[39m       [36mconst[39m processed [33m=[39m emailService[[32m'processTemplate'[39m](template[33m,[39m variables)
     [90m     |[39m                                                        [31m[1m^[22m[39m
     [90m 292 |[39m
     [90m 293 |[39m       expect(processed[33m.[39msubject)[33m.[39mtoBe([32m'Hello John!'[39m)
     [90m 294 |[39m       expect(processed[33m.[39mhtmlContent)[33m.[39mtoBe([32m'<p></p>'[39m)[0m

      at Object.<anonymous> (src/services/notifications/__tests__/email-channel.test.ts:291:56)

  ● EmailChannelService › Rate Limiting › should respect rate limits

    TypeError: emailService.send is not a function

    [0m [90m 313 |[39m       } [36mas[39m any
     [90m 314 |[39m
    [31m[1m>[22m[39m[90m 315 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m emailService[33m.[39msend(payload)
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 316 |[39m
     [90m 317 |[39m       expect(result[33m.[39msuccess)[33m.[39mtoBe([36mfalse[39m)
     [90m 318 |[39m       expect(result[33m.[39merror)[33m.[39mtoContain([32m'Rate limit exceeded'[39m)[0m

      at Object.send (src/services/notifications/__tests__/email-channel.test.ts:315:41)

  ● EmailChannelService › Webhook Handling › should handle delivery webhook

    TypeError: emailService.handleWebhook is not a function

    [0m [90m 333 |[39m       mockPrisma[33m.[39mnotificationDeliveryLog[33m.[39mupdate[33m.[39mmockResolvedValue({} [36mas[39m any)
     [90m 334 |[39m
    [31m[1m>[22m[39m[90m 335 |[39m       [36mawait[39m emailService[33m.[39mhandleWebhook(webhookData)
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 336 |[39m
     [90m 337 |[39m       expect(mockPrisma[33m.[39mnotificationDeliveryLog[33m.[39mupdate)[33m.[39mtoHaveBeenCalledWith({
     [90m 338 |[39m         where[33m:[39m { externalMessageId[33m:[39m [32m'email-123'[39m }[33m,[39m[0m

      at Object.handleWebhook (src/services/notifications/__tests__/email-channel.test.ts:335:26)

  ● EmailChannelService › Webhook Handling › should handle bounce webhook

    TypeError: emailService.handleWebhook is not a function

    [0m [90m 362 |[39m       mockPrisma[33m.[39mnotificationDeliveryLog[33m.[39mupdate[33m.[39mmockResolvedValue({} [36mas[39m any)
     [90m 363 |[39m
    [31m[1m>[22m[39m[90m 364 |[39m       [36mawait[39m emailService[33m.[39mhandleWebhook(webhookData)
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 365 |[39m
     [90m 366 |[39m       expect(mockPrisma[33m.[39mnotificationDeliveryLog[33m.[39mupdate)[33m.[39mtoHaveBeenCalledWith({
     [90m 367 |[39m         where[33m:[39m { externalMessageId[33m:[39m [32m'email-123'[39m }[33m,[39m[0m

      at Object.handleWebhook (src/services/notifications/__tests__/email-channel.test.ts:364:26)

  ● EmailChannelService › Webhook Handling › should handle open webhook

    TypeError: emailService.handleWebhook is not a function

    [0m [90m 389 |[39m       }
     [90m 390 |[39m
    [31m[1m>[22m[39m[90m 391 |[39m       [36mawait[39m emailService[33m.[39mhandleWebhook(webhookData)
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 392 |[39m
     [90m 393 |[39m       expect(mockAnalytics[33m.[39mtrackEvent)[33m.[39mtoHaveBeenCalledWith([32m'email_opened'[39m[33m,[39m {
     [90m 394 |[39m         messageId[33m:[39m [32m'email-123'[39m[33m,[39m[0m

      at Object.handleWebhook (src/services/notifications/__tests__/email-channel.test.ts:391:26)

  ● EmailChannelService › Webhook Handling › should handle click webhook

    TypeError: emailService.handleWebhook is not a function

    [0m [90m 409 |[39m       }
     [90m 410 |[39m
    [31m[1m>[22m[39m[90m 411 |[39m       [36mawait[39m emailService[33m.[39mhandleWebhook(webhookData)
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 412 |[39m
     [90m 413 |[39m       expect(mockAnalytics[33m.[39mtrackEvent)[33m.[39mtoHaveBeenCalledWith([32m'email_clicked'[39m[33m,[39m {
     [90m 414 |[39m         messageId[33m:[39m [32m'email-123'[39m[33m,[39m[0m

      at Object.handleWebhook (src/services/notifications/__tests__/email-channel.test.ts:411:26)

FAIL tests/integration/recommendation-system.test.ts
  ● Test suite failed to run

    Cannot find module '../../lib/ml/matrix-factorization' from 'src/services/matching/collaborative-filter.ts'

    Require stack:
      src/services/matching/collaborative-filter.ts
      src/services/matching/recommendation-engine.ts
      tests/integration/recommendation-system.test.ts

    [0m [90m 17 |[39m
     [90m 18 |[39m [90m/**[39m
    [31m[1m>[22m[39m[90m 19 |[39m [90m * User interaction data[39m
     [90m    |[39m                              [31m[1m^[22m[39m
     [90m 20 |[39m [90m */[39m
     [90m 21 |[39m [36minterface[39m [33mUserItemInteraction[39m {
     [90m 22 |[39m   userId[33m:[39m string[33m;[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.<anonymous> (src/services/matching/collaborative-filter.ts:19:30)
      at Object.<anonymous> (src/services/matching/recommendation-engine.ts:19:30)
      at Object.<anonymous> (tests/integration/recommendation-system.test.ts:35:31)

FAIL __tests__/services/matching/profile-analyzer.test.ts
  ● Test suite failed to run

      [31mx[0m Expected '{', got 'interface'
         ,-[[36;1;4mE:\projects\jobfinders_mvp\src\types\profiles.ts[0m:671:1]
     [2m668[0m |   GEOGRAPHIC = 'geographic'
     [2m669[0m | }
     [2m670[0m | 
     [2m671[0m | export interface CompensationPhilosophy {
         : [35;1m       ^^^^^^^^^[0m
     [2m672[0m |   type: CompensationType;
     [2m673[0m |   range: SalaryRange;
     [2m674[0m |   bonuses: BonusStructure[];
         `----


    Caused by:
        Syntax Error

    [0m [90m  5 |[39m   [33mJobProfile[39m[33m,[39m
     [90m  6 |[39m   [33mWorkExperience[39m[33m,[39m
    [31m[1m>[22m[39m[90m  7 |[39m   [33mEducation[39m[33m,[39m
     [90m    |[39m                   [31m[1m^[22m[39m
     [90m  8 |[39m   [33mJobRequirements[39m
     [90m  9 |[39m } [36mfrom[39m [32m'@/types/profiles'[39m[33m;[39m
     [90m 10 |[39m [36mimport[39m { [33mExperienceLevel[39m[33m,[39m [33mSkillLevel[39m[33m,[39m [33mEducationLevel[39m } [36mfrom[39m [32m'@/types/profiles'[39m[33m;[39m[0m

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)
      at Object.<anonymous> (__tests__/services/matching/profile-analyzer.test.ts:7:19)

FAIL tests/integration/matching-workflow.test.ts
  ● Test suite failed to run

      [31mx[0m Expected ';', got ')'
         ,-[[36;1;4mE:\projects\jobfinders_mvp\src\lib\scoring\algorithms.ts[0m:849:1]
     [2m846[0m |     } else {
     [2m847[0m |       // Candidate salary is above job range
     [2m848[0m |       const excess = (candidateMin - jobMax) / candidateMin;
     [2m849[0m |       return Math.max(0, 1 - excess * 0.5));
         : [35;1m                                          ^[0m
     [2m850[0m |     }
     [2m851[0m |   }
     [2m852[0m | }
         `----


    Caused by:
        Syntax Error

    [0m [90m 19 |[39m   [33mLocationMatcher[39m[33m,[39m
     [90m 20 |[39m   [33mPreferencesMatcher[39m[33m,[39m
    [31m[1m>[22m[39m[90m 21 |[39m   [33mSalaryMatcher[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 22 |[39m } [36mfrom[39m [32m'@/lib/scoring/algorithms'[39m[33m;[39m
     [90m 23 |[39m [36mimport[39m { [33mExplanationGenerator[39m } [36mfrom[39m [32m'@/lib/scoring/explanations'[39m[33m;[39m
     [90m 24 |[39m [36mimport[39m { logger } [36mfrom[39m [32m'@/lib/logging/logger'[39m[33m;[39m[0m

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)
      at Object.<anonymous> (src/services/matching/scoring-engine.ts:21:21)
      at Object.<anonymous> (tests/integration/matching-workflow.test.ts:28:24)

FAIL __tests__/subscription.test.ts
  ● Test suite failed to run

    Cannot find module 'pdf-lib' from 'src/services/invoice.ts'

    Require stack:
      src/services/invoice.ts
      __tests__/subscription.test.ts

    [0m [90m 10 |[39m   status[33m:[39m [32m'PAID'[39m [33m|[39m [32m'PENDING'[39m [33m|[39m [32m'FAILED'[39m[33m;[39m
     [90m 11 |[39m   billingPeriod[33m:[39m {
    [31m[1m>[22m[39m[90m 12 |[39m     start[33m:[39m [33mDate[39m[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 13 |[39m     end[33m:[39m [33mDate[39m[33m;[39m
     [90m 14 |[39m   }[33m;[39m
     [90m 15 |[39m   items[33m:[39m [33mArray[39m[33m<[39m{[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.<anonymous> (src/services/invoice.ts:12:17)
      at Object.<anonymous> (__tests__/subscription.test.ts:9:18)

FAIL tests/services/matching/profile-analyzer.test.ts
  ● Console

    console.error
      Redis rate limiting error: TypeError: this.redisClient.zremrangebyscore is not a function
          at RateLimiter.zremrangebyscore [as limitWithRedis] (E:\projects\jobfinders_mvp\src\lib\rate-limiter.ts:49:30)
          at RateLimiter.limitWithRedis [as limit] (E:\projects\jobfinders_mvp\src\lib\rate-limiter.ts:40:19)
          at RateLimiter.limit (E:\projects\jobfinders_mvp\src\lib\rate-limiter.ts:112:31)
          at OpenRouterClient.check [as chatCompletion] (E:\projects\jobfinders_mvp\src\lib\openrouter.ts:39:30)
          at ProfileAnalyzer.chatCompletion [as extractSkills] (E:\projects\jobfinders_mvp\src\services\matching\profile-analyzer.ts:178:38)
          at Object.extractSkills (E:\projects\jobfinders_mvp\tests\services\matching\profile-analyzer.test.ts:285:44)
          at Promise.finally.completed (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1557:28)
          at new Promise (<anonymous>)
          at callAsyncCircusFn (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1497:10)
          at _callCircusTest (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1007:40)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at _runTest (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:947:3)
          at E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:849:7
          at _runTestsForDescribeBlock (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:862:11)
          at _runTestsForDescribeBlock (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:857:11)
          at _runTestsForDescribeBlock (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:857:11)
          at run (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:761:3)
          at runAndTransformResultsToJestFormat (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1918:21)
          at jestAdapter (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\runner.js:101:19)
          at runTestInternal (E:\projects\jobfinders_mvp\node_modules\jest-runner\build\testWorker.js:275:16)
          at runTest (E:\projects\jobfinders_mvp\node_modules\jest-runner\build\testWorker.js:343:7)
          at Object.worker (E:\projects\jobfinders_mvp\node_modules\jest-runner\build\testWorker.js:497:12)

    [0m [90m 77 |[39m       }[33m;[39m
     [90m 78 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 79 |[39m       console[33m.[39merror([32m'Redis rate limiting error:'[39m[33m,[39m error)[33m;[39m
     [90m    |[39m               [31m[1m^[22m[39m
     [90m 80 |[39m       [90m// Fallback to in-memory[39m
     [90m 81 |[39m       [36mreturn[39m [36mthis[39m[33m.[39mlimitInMemory(key[33m,[39m now[33m,[39m windowStart)[33m;[39m
     [90m 82 |[39m     }[0m

      at RateLimiter.error [as limitWithRedis] (src/lib/rate-limiter.ts:79:15)
      at RateLimiter.limitWithRedis [as limit] (src/lib/rate-limiter.ts:40:19)
      at RateLimiter.limit (src/lib/rate-limiter.ts:112:31)
      at OpenRouterClient.check [as chatCompletion] (src/lib/openrouter.ts:39:30)
      at ProfileAnalyzer.chatCompletion [as extractSkills] (src/services/matching/profile-analyzer.ts:178:38)
      at Object.extractSkills (tests/services/matching/profile-analyzer.test.ts:285:44)

    console.error
      Error extracting skills: OpenRouterError: Failed to complete chat request
          at OpenRouterClient.chatCompletion (E:\projects\jobfinders_mvp\src\lib\openrouter.ts:83:11)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at ProfileAnalyzer.extractSkills (E:\projects\jobfinders_mvp\src\services\matching\profile-analyzer.ts:178:24)
          at Object.<anonymous> (E:\projects\jobfinders_mvp\tests\services\matching\profile-analyzer.test.ts:285:22) {
        statusCode: undefined,
        retryable: false
      }

    [0m [90m 194 |[39m       }))[33m;[39m
     [90m 195 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 196 |[39m       console[33m.[39merror([32m'Error extracting skills:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 197 |[39m       [36mreturn[39m [][33m;[39m
     [90m 198 |[39m     }
     [90m 199 |[39m   }[0m

      at ProfileAnalyzer.error [as extractSkills] (src/services/matching/profile-analyzer.ts:196:15)
      at Object.<anonymous> (tests/services/matching/profile-analyzer.test.ts:285:22)

    console.error
      Redis rate limiting error: TypeError: this.redisClient.zremrangebyscore is not a function
          at RateLimiter.zremrangebyscore [as limitWithRedis] (E:\projects\jobfinders_mvp\src\lib\rate-limiter.ts:49:30)
          at RateLimiter.limitWithRedis [as limit] (E:\projects\jobfinders_mvp\src\lib\rate-limiter.ts:40:19)
          at RateLimiter.limit (E:\projects\jobfinders_mvp\src\lib\rate-limiter.ts:112:31)
          at OpenRouterClient.check [as chatCompletion] (E:\projects\jobfinders_mvp\src\lib\openrouter.ts:39:30)
          at ProfileAnalyzer.chatCompletion [as extractSkills] (E:\projects\jobfinders_mvp\src\services\matching\profile-analyzer.ts:178:38)
          at Object.extractSkills (E:\projects\jobfinders_mvp\tests\services\matching\profile-analyzer.test.ts:305:44)
          at Promise.finally.completed (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1557:28)
          at new Promise (<anonymous>)
          at callAsyncCircusFn (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1497:10)
          at _callCircusTest (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1007:40)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at _runTest (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:947:3)
          at E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:849:7
          at _runTestsForDescribeBlock (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:862:11)
          at _runTestsForDescribeBlock (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:857:11)
          at _runTestsForDescribeBlock (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:857:11)
          at run (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:761:3)
          at runAndTransformResultsToJestFormat (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1918:21)
          at jestAdapter (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\runner.js:101:19)
          at runTestInternal (E:\projects\jobfinders_mvp\node_modules\jest-runner\build\testWorker.js:275:16)
          at runTest (E:\projects\jobfinders_mvp\node_modules\jest-runner\build\testWorker.js:343:7)
          at Object.worker (E:\projects\jobfinders_mvp\node_modules\jest-runner\build\testWorker.js:497:12)

    [0m [90m 77 |[39m       }[33m;[39m
     [90m 78 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 79 |[39m       console[33m.[39merror([32m'Redis rate limiting error:'[39m[33m,[39m error)[33m;[39m
     [90m    |[39m               [31m[1m^[22m[39m
     [90m 80 |[39m       [90m// Fallback to in-memory[39m
     [90m 81 |[39m       [36mreturn[39m [36mthis[39m[33m.[39mlimitInMemory(key[33m,[39m now[33m,[39m windowStart)[33m;[39m
     [90m 82 |[39m     }[0m

      at RateLimiter.error [as limitWithRedis] (src/lib/rate-limiter.ts:79:15)
      at RateLimiter.limitWithRedis [as limit] (src/lib/rate-limiter.ts:40:19)
      at RateLimiter.limit (src/lib/rate-limiter.ts:112:31)
      at OpenRouterClient.check [as chatCompletion] (src/lib/openrouter.ts:39:30)
      at ProfileAnalyzer.chatCompletion [as extractSkills] (src/services/matching/profile-analyzer.ts:178:38)
      at Object.extractSkills (tests/services/matching/profile-analyzer.test.ts:305:44)

    console.error
      Error extracting skills: OpenRouterError: Failed to complete chat request
          at OpenRouterClient.chatCompletion (E:\projects\jobfinders_mvp\src\lib\openrouter.ts:83:11)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at ProfileAnalyzer.extractSkills (E:\projects\jobfinders_mvp\src\services\matching\profile-analyzer.ts:178:24)
          at Object.<anonymous> (E:\projects\jobfinders_mvp\tests\services\matching\profile-analyzer.test.ts:305:22) {
        statusCode: undefined,
        retryable: false
      }

    [0m [90m 194 |[39m       }))[33m;[39m
     [90m 195 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 196 |[39m       console[33m.[39merror([32m'Error extracting skills:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 197 |[39m       [36mreturn[39m [][33m;[39m
     [90m 198 |[39m     }
     [90m 199 |[39m   }[0m

      at ProfileAnalyzer.error [as extractSkills] (src/services/matching/profile-analyzer.ts:196:15)
      at Object.<anonymous> (tests/services/matching/profile-analyzer.test.ts:305:22)

    console.error
      Redis rate limiting error: TypeError: this.redisClient.zremrangebyscore is not a function
          at RateLimiter.zremrangebyscore [as limitWithRedis] (E:\projects\jobfinders_mvp\src\lib\rate-limiter.ts:49:30)
          at RateLimiter.limitWithRedis [as limit] (E:\projects\jobfinders_mvp\src\lib\rate-limiter.ts:40:19)
          at RateLimiter.limit (E:\projects\jobfinders_mvp\src\lib\rate-limiter.ts:112:31)
          at OpenRouterClient.check [as chatCompletion] (E:\projects\jobfinders_mvp\src\lib\openrouter.ts:39:30)
          at ProfileAnalyzer.chatCompletion [as extractSkills] (E:\projects\jobfinders_mvp\src\services\matching\profile-analyzer.ts:178:38)
          at Object.extractSkills (E:\projects\jobfinders_mvp\tests\services\matching\profile-analyzer.test.ts:319:44)
          at Promise.finally.completed (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1557:28)
          at new Promise (<anonymous>)
          at callAsyncCircusFn (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1497:10)
          at _callCircusTest (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1007:40)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at _runTest (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:947:3)
          at E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:849:7
          at _runTestsForDescribeBlock (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:862:11)
          at _runTestsForDescribeBlock (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:857:11)
          at _runTestsForDescribeBlock (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:857:11)
          at run (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:761:3)
          at runAndTransformResultsToJestFormat (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\jestAdapterInit.js:1918:21)
          at jestAdapter (E:\projects\jobfinders_mvp\node_modules\jest-circus\build\runner.js:101:19)
          at runTestInternal (E:\projects\jobfinders_mvp\node_modules\jest-runner\build\testWorker.js:275:16)
          at runTest (E:\projects\jobfinders_mvp\node_modules\jest-runner\build\testWorker.js:343:7)
          at Object.worker (E:\projects\jobfinders_mvp\node_modules\jest-runner\build\testWorker.js:497:12)

    [0m [90m 77 |[39m       }[33m;[39m
     [90m 78 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 79 |[39m       console[33m.[39merror([32m'Redis rate limiting error:'[39m[33m,[39m error)[33m;[39m
     [90m    |[39m               [31m[1m^[22m[39m
     [90m 80 |[39m       [90m// Fallback to in-memory[39m
     [90m 81 |[39m       [36mreturn[39m [36mthis[39m[33m.[39mlimitInMemory(key[33m,[39m now[33m,[39m windowStart)[33m;[39m
     [90m 82 |[39m     }[0m

      at RateLimiter.error [as limitWithRedis] (src/lib/rate-limiter.ts:79:15)
      at RateLimiter.limitWithRedis [as limit] (src/lib/rate-limiter.ts:40:19)
      at RateLimiter.limit (src/lib/rate-limiter.ts:112:31)
      at OpenRouterClient.check [as chatCompletion] (src/lib/openrouter.ts:39:30)
      at ProfileAnalyzer.chatCompletion [as extractSkills] (src/services/matching/profile-analyzer.ts:178:38)
      at Object.extractSkills (tests/services/matching/profile-analyzer.test.ts:319:44)

    console.error
      Error extracting skills: OpenRouterError: Failed to complete chat request
          at OpenRouterClient.chatCompletion (E:\projects\jobfinders_mvp\src\lib\openrouter.ts:83:11)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at ProfileAnalyzer.extractSkills (E:\projects\jobfinders_mvp\src\services\matching\profile-analyzer.ts:178:24)
          at Object.<anonymous> (E:\projects\jobfinders_mvp\tests\services\matching\profile-analyzer.test.ts:319:22) {
        statusCode: undefined,
        retryable: false
      }

    [0m [90m 194 |[39m       }))[33m;[39m
     [90m 195 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 196 |[39m       console[33m.[39merror([32m'Error extracting skills:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m               [31m[1m^[22m[39m
     [90m 197 |[39m       [36mreturn[39m [][33m;[39m
     [90m 198 |[39m     }
     [90m 199 |[39m   }[0m

      at ProfileAnalyzer.error [as extractSkills] (src/services/matching/profile-analyzer.ts:196:15)
      at Object.<anonymous> (tests/services/matching/profile-analyzer.test.ts:319:22)

  ● ProfileAnalyzer › analyzeProfile › should analyze profile and return results

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 124 |[39m   describe([32m'analyzeProfile'[39m[33m,[39m () [33m=>[39m {
     [90m 125 |[39m     it([32m'should analyze profile and return results'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 126 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 127 |[39m
     [90m 128 |[39m       expect(result)[33m.[39mtoBeDefined()[33m;[39m
     [90m 129 |[39m       expect(result[33m.[39mcompleteness)[33m.[39mtoBeGreaterThanOrEqual([35m0[39m)[33m;[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:126:44)

  ● ProfileAnalyzer › analyzeProfile › should calculate completeness score correctly

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 136 |[39m
     [90m 137 |[39m     it([32m'should calculate completeness score correctly'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 138 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 139 |[39m
     [90m 140 |[39m       expect(result[33m.[39mcompleteness)[33m.[39mtoBeGreaterThan([35m80[39m)[33m;[39m
     [90m 141 |[39m       expect(result[33m.[39mcompleteness)[33m.[39mtoBeLessThanOrEqual([35m100[39m)[33m;[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:138:44)

  ● ProfileAnalyzer › analyzeProfile › should identify strengths

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 143 |[39m
     [90m 144 |[39m     it([32m'should identify strengths'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 145 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 146 |[39m
     [90m 147 |[39m       expect(result[33m.[39mstrengths[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m
     [90m 148 |[39m       expect(result[33m.[39mstrengths)[33m.[39mtoContainEqual([0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:145:44)

  ● ProfileAnalyzer › analyzeProfile › should identify weaknesses

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 163 |[39m       }[33m;[39m
     [90m 164 |[39m
    [31m[1m>[22m[39m[90m 165 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(incompleteProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 166 |[39m
     [90m 167 |[39m       expect(result[33m.[39mweaknesses[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m
     [90m 168 |[39m       expect(result[33m.[39mweaknesses)[33m.[39mtoContainEqual([0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:165:44)

  ● ProfileAnalyzer › analyzeProfile › should provide recommendations

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 176 |[39m
     [90m 177 |[39m     it([32m'should provide recommendations'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 178 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 179 |[39m
     [90m 180 |[39m       expect(result[33m.[39mrecommendations[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m
     [90m 181 |[39m       expect(result[33m.[39mrecommendations)[33m.[39mtoContainEqual([0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:178:44)

  ● ProfileAnalyzer › analyzeProfile › should handle empty profile

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 211 |[39m       }[33m;[39m
     [90m 212 |[39m
    [31m[1m>[22m[39m[90m 213 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(emptyProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 214 |[39m
     [90m 215 |[39m       expect(result[33m.[39mcompleteness)[33m.[39mtoBeLessThan([35m20[39m)[33m;[39m
     [90m 216 |[39m       expect(result[33m.[39mweaknesses[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m5[39m)[33m;[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:213:44)

  ● ProfileAnalyzer › calculateCompleteness › should give high score for complete profile

    TypeError: profileAnalyzer.calculateCompleteness is not a function

    [0m [90m 220 |[39m   describe([32m'calculateCompleteness'[39m[33m,[39m () [33m=>[39m {
     [90m 221 |[39m     it([32m'should give high score for complete profile'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 222 |[39m       [36mconst[39m score [33m=[39m profileAnalyzer[33m.[39mcalculateCompleteness(mockProfile)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 223 |[39m
     [90m 224 |[39m       expect(score)[33m.[39mtoBeGreaterThan([35m80[39m)[33m;[39m
     [90m 225 |[39m       expect(score)[33m.[39mtoBeLessThanOrEqual([35m100[39m)[33m;[39m[0m

      at Object.calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:222:37)

  ● ProfileAnalyzer › calculateCompleteness › should give low score for incomplete profile

    TypeError: profileAnalyzer.calculateCompleteness is not a function

    [0m [90m 235 |[39m       }[33m;[39m
     [90m 236 |[39m
    [31m[1m>[22m[39m[90m 237 |[39m       [36mconst[39m score [33m=[39m profileAnalyzer[33m.[39mcalculateCompleteness(incompleteProfile)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 238 |[39m
     [90m 239 |[39m       expect(score)[33m.[39mtoBeLessThan([35m50[39m)[33m;[39m
     [90m 240 |[39m     })[33m;[39m[0m

      at Object.calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:237:37)

  ● ProfileAnalyzer › calculateCompleteness › should calculate personal info completeness

    TypeError: profileAnalyzer.calculateCompleteness is not a function

    [0m [90m 246 |[39m       }[33m;[39m
     [90m 247 |[39m
    [31m[1m>[22m[39m[90m 248 |[39m       [36mconst[39m score [33m=[39m profileAnalyzer[33m.[39mcalculateCompleteness(profileWithoutPersonalInfo)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 249 |[39m
     [90m 250 |[39m       expect(score)[33m.[39mtoBeLessThan(mockProfile[33m.[39mcompleteness)[33m;[39m
     [90m 251 |[39m     })[33m;[39m[0m

      at Object.calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:248:37)

  ● ProfileAnalyzer › calculateCompleteness › should calculate experience completeness

    TypeError: profileAnalyzer.calculateCompleteness is not a function

    [0m [90m 257 |[39m       }[33m;[39m
     [90m 258 |[39m
    [31m[1m>[22m[39m[90m 259 |[39m       [36mconst[39m score [33m=[39m profileAnalyzer[33m.[39mcalculateCompleteness(profileWithoutExperience)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 260 |[39m
     [90m 261 |[39m       expect(score)[33m.[39mtoBeLessThan(mockProfile[33m.[39mcompleteness)[33m;[39m
     [90m 262 |[39m     })[33m;[39m[0m

      at Object.calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:259:37)

  ● ProfileAnalyzer › calculateCompleteness › should calculate skills completeness

    TypeError: profileAnalyzer.calculateCompleteness is not a function

    [0m [90m 268 |[39m       }[33m;[39m
     [90m 269 |[39m
    [31m[1m>[22m[39m[90m 270 |[39m       [36mconst[39m score [33m=[39m profileAnalyzer[33m.[39mcalculateCompleteness(profileWithoutSkills)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 271 |[39m
     [90m 272 |[39m       expect(score)[33m.[39mtoBeLessThan(mockProfile[33m.[39mcompleteness)[33m;[39m
     [90m 273 |[39m     })[33m;[39m[0m

      at Object.calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:270:37)

  ● ProfileAnalyzer › extractSkills › should extract skills from experience descriptions

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

    [0m [90m 286 |[39m
     [90m 287 |[39m       expect(result)[33m.[39mtoBeDefined()[33m;[39m
    [31m[1m>[22m[39m[90m 288 |[39m       expect(result[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 289 |[39m       expect(result)[33m.[39mtoContainEqual(
     [90m 290 |[39m         expect[33m.[39mobjectContaining({
     [90m 291 |[39m           name[33m:[39m expect[33m.[39many([33mString[39m)[33m,[39m[0m

      at Object.toBeGreaterThan (tests/services/matching/profile-analyzer.test.ts:288:29)

  ● ProfileAnalyzer › extractSkills › should extract skills from projects

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

    [0m [90m 306 |[39m
     [90m 307 |[39m       expect(result)[33m.[39mtoBeDefined()[33m;[39m
    [31m[1m>[22m[39m[90m 308 |[39m       expect(result[33m.[39msome(skill [33m=>[39m skill[33m.[39msource [33m===[39m [32m'projects'[39m))[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m     |[39m                                                                 [31m[1m^[22m[39m
     [90m 309 |[39m     })[33m;[39m
     [90m 310 |[39m
     [90m 311 |[39m     it([32m'should deduplicate extracted skills'[39m[33m,[39m [36masync[39m () [33m=>[39m {[0m

      at Object.toBe (tests/services/matching/profile-analyzer.test.ts:308:65)

  ● ProfileAnalyzer › extractSkills › should deduplicate extracted skills

    expect(received).toBe(expected) // Object.is equality

    Expected: 1
    Received: 0

    [0m [90m 320 |[39m
     [90m 321 |[39m       [36mconst[39m reactSkills [33m=[39m result[33m.[39mfilter(skill [33m=>[39m skill[33m.[39mname [33m===[39m [32m'React'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 322 |[39m       expect(reactSkills[33m.[39mlength)[33m.[39mtoBe([35m1[39m)[33m;[39m
     [90m     |[39m                                  [31m[1m^[22m[39m
     [90m 323 |[39m     })[33m;[39m
     [90m 324 |[39m   })[33m;[39m
     [90m 325 |[39m[0m

      at Object.toBe (tests/services/matching/profile-analyzer.test.ts:322:34)

  ● ProfileAnalyzer › validateExperience › should validate experience entries

    TypeError: profileAnalyzer.validateExperience is not a function

    [0m [90m 328 |[39m       [36mconst[39m validExperience [33m=[39m mockProfile[33m.[39mexperience[[35m0[39m][33m;[39m
     [90m 329 |[39m
    [31m[1m>[22m[39m[90m 330 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mvalidateExperience(validExperience)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 331 |[39m
     [90m 332 |[39m       expect(result[33m.[39misValid)[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m 333 |[39m       expect(result[33m.[39merrors)[33m.[39mtoHaveLength([35m0[39m)[33m;[39m[0m

      at Object.validateExperience (tests/services/matching/profile-analyzer.test.ts:330:38)

  ● ProfileAnalyzer › validateExperience › should identify invalid experience entries

    TypeError: profileAnalyzer.validateExperience is not a function

    [0m [90m 347 |[39m       }[33m;[39m
     [90m 348 |[39m
    [31m[1m>[22m[39m[90m 349 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mvalidateExperience(invalidExperience)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 350 |[39m
     [90m 351 |[39m       expect(result[33m.[39misValid)[33m.[39mtoBe([36mfalse[39m)[33m;[39m
     [90m 352 |[39m       expect(result[33m.[39merrors[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m[0m

      at Object.validateExperience (tests/services/matching/profile-analyzer.test.ts:349:38)

  ● ProfileAnalyzer › validateExperience › should handle missing required fields

    TypeError: profileAnalyzer.validateExperience is not a function

    [0m [90m 365 |[39m       }[33m;[39m
     [90m 366 |[39m
    [31m[1m>[22m[39m[90m 367 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mvalidateExperience(incompleteExperience)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 368 |[39m
     [90m 369 |[39m       expect(result[33m.[39misValid)[33m.[39mtoBe([36mfalse[39m)[33m;[39m
     [90m 370 |[39m       expect(result[33m.[39merrors[33m.[39msome(error [33m=>[39m error[33m.[39mincludes([32m'company'[39m)))[33m.[39mtoBe([36mtrue[39m)[33m;[39m[0m

      at Object.validateExperience (tests/services/matching/profile-analyzer.test.ts:367:38)

  ● ProfileAnalyzer › validateExperience › should validate date consistency

    TypeError: profileAnalyzer.validateExperience is not a function

    [0m [90m 379 |[39m       }[33m;[39m
     [90m 380 |[39m
    [31m[1m>[22m[39m[90m 381 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mvalidateExperience(experienceWithBadDates)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 382 |[39m
     [90m 383 |[39m       expect(result[33m.[39misValid)[33m.[39mtoBe([36mfalse[39m)[33m;[39m
     [90m 384 |[39m       expect(result[33m.[39merrors[33m.[39msome(error [33m=>[39m error[33m.[39mincludes([32m'date'[39m)))[33m.[39mtoBe([36mtrue[39m)[33m;[39m[0m

      at Object.validateExperience (tests/services/matching/profile-analyzer.test.ts:381:38)

  ● ProfileAnalyzer › analyzeSkills › should analyze skill distribution

    TypeError: profileAnalyzer.analyzeSkills is not a function

    [0m [90m 388 |[39m   describe([32m'analyzeSkills'[39m[33m,[39m () [33m=>[39m {
     [90m 389 |[39m     it([32m'should analyze skill distribution'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 390 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeSkills(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 391 |[39m
     [90m 392 |[39m       expect(result)[33m.[39mtoBeDefined()[33m;[39m
     [90m 393 |[39m       expect(result[33m.[39mtotalSkills)[33m.[39mtoBe(mockProfile[33m.[39mskills[33m.[39mlength)[33m;[39m[0m

      at Object.analyzeSkills (tests/services/matching/profile-analyzer.test.ts:390:44)

  ● ProfileAnalyzer › analyzeSkills › should categorize skills correctly

    TypeError: profileAnalyzer.analyzeSkills is not a function

    [0m [90m 398 |[39m
     [90m 399 |[39m     it([32m'should categorize skills correctly'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 400 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeSkills(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 401 |[39m
     [90m 402 |[39m       expect(result[33m.[39mcategories)[33m.[39mtoHaveProperty([32m'technical'[39m)[33m;[39m
     [90m 403 |[39m       expect(result[33m.[39mcategories)[33m.[39mtoHaveProperty([32m'soft'[39m)[33m;[39m[0m

      at Object.analyzeSkills (tests/services/matching/profile-analyzer.test.ts:400:44)

  ● ProfileAnalyzer › analyzeSkills › should calculate level distribution

    TypeError: profileAnalyzer.analyzeSkills is not a function

    [0m [90m 406 |[39m
     [90m 407 |[39m     it([32m'should calculate level distribution'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 408 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeSkills(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 409 |[39m
     [90m 410 |[39m       expect(result[33m.[39mlevelDistribution)[33m.[39mtoHaveProperty([32m'EXPERT'[39m)[33m;[39m
     [90m 411 |[39m       expect(result[33m.[39mlevelDistribution)[33m.[39mtoHaveProperty([32m'ADVANCED'[39m)[33m;[39m[0m

      at Object.analyzeSkills (tests/services/matching/profile-analyzer.test.ts:408:44)

  ● ProfileAnalyzer › analyzeSkills › should identify top skills

    TypeError: profileAnalyzer.analyzeSkills is not a function

    [0m [90m 415 |[39m
     [90m 416 |[39m     it([32m'should identify top skills'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 417 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeSkills(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 418 |[39m
     [90m 419 |[39m       expect(result[33m.[39mtopSkills)[33m.[39mtoBeDefined()[33m;[39m
     [90m 420 |[39m       expect(result[33m.[39mtopSkills[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m[0m

      at Object.analyzeSkills (tests/services/matching/profile-analyzer.test.ts:417:44)

  ● ProfileAnalyzer › analyzeSkills › should suggest missing skills

    TypeError: profileAnalyzer.analyzeSkills is not a function

    [0m [90m 425 |[39m
     [90m 426 |[39m     it([32m'should suggest missing skills'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 427 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeSkills(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 428 |[39m
     [90m 429 |[39m       expect(result[33m.[39msuggestedSkills)[33m.[39mtoBeDefined()[33m;[39m
     [90m 430 |[39m       expect([33mArray[39m[33m.[39misArray(result[33m.[39msuggestedSkills))[33m.[39mtoBe([36mtrue[39m)[33m;[39m[0m

      at Object.analyzeSkills (tests/services/matching/profile-analyzer.test.ts:427:44)

  ● ProfileAnalyzer › generateRecommendations › should generate profile improvement recommendations

    TypeError: profileAnalyzer.generateRecommendations is not a function

    [0m [90m 434 |[39m   describe([32m'generateRecommendations'[39m[33m,[39m () [33m=>[39m {
     [90m 435 |[39m     it([32m'should generate profile improvement recommendations'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 436 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mgenerateRecommendations(mockProfile)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 437 |[39m
     [90m 438 |[39m       expect(result)[33m.[39mtoBeDefined()[33m;[39m
     [90m 439 |[39m       expect(result[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m[0m

      at Object.generateRecommendations (tests/services/matching/profile-analyzer.test.ts:436:38)

  ● ProfileAnalyzer › generateRecommendations › should prioritize recommendations correctly

    TypeError: profileAnalyzer.generateRecommendations is not a function

    [0m [90m 449 |[39m       }[33m;[39m
     [90m 450 |[39m
    [31m[1m>[22m[39m[90m 451 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mgenerateRecommendations(incompleteProfile)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 452 |[39m
     [90m 453 |[39m       expect(result)[33m.[39mtoContainEqual(
     [90m 454 |[39m         expect[33m.[39mobjectContaining({[0m

      at Object.generateRecommendations (tests/services/matching/profile-analyzer.test.ts:451:38)

  ● ProfileAnalyzer › generateRecommendations › should categorize recommendations

    TypeError: profileAnalyzer.generateRecommendations is not a function

    [0m [90m 459 |[39m
     [90m 460 |[39m     it([32m'should categorize recommendations'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 461 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mgenerateRecommendations(mockProfile)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 462 |[39m
     [90m 463 |[39m       expect(result[33m.[39msome(rec [33m=>[39m rec[33m.[39mcategory [33m===[39m [32m'experience'[39m))[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m 464 |[39m       expect(result[33m.[39msome(rec [33m=>[39m rec[33m.[39mcategory [33m===[39m [32m'skills'[39m))[33m.[39mtoBe([36mtrue[39m)[33m;[39m[0m

      at Object.generateRecommendations (tests/services/matching/profile-analyzer.test.ts:461:38)

  ● ProfileAnalyzer › generateRecommendations › should provide actionable recommendations

    TypeError: profileAnalyzer.generateRecommendations is not a function

    [0m [90m 467 |[39m
     [90m 468 |[39m     it([32m'should provide actionable recommendations'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 469 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mgenerateRecommendations(mockProfile)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 470 |[39m
     [90m 471 |[39m       result[33m.[39mforEach(recommendation [33m=>[39m {
     [90m 472 |[39m         expect(recommendation[33m.[39maction)[33m.[39mtoBeDefined()[33m;[39m[0m

      at Object.generateRecommendations (tests/services/matching/profile-analyzer.test.ts:469:38)

  ● ProfileAnalyzer › error handling › should handle null profile

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 480 |[39m   describe([32m'error handling'[39m[33m,[39m () [33m=>[39m {
     [90m 481 |[39m     it([32m'should handle null profile'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 482 |[39m       [36mawait[39m expect(profileAnalyzer[33m.[39manalyzeProfile([36mnull[39m [36mas[39m any))
     [90m     |[39m                                    [31m[1m^[22m[39m
     [90m 483 |[39m         [33m.[39mrejects[33m.[39mtoThrow()[33m;[39m
     [90m 484 |[39m     })[33m;[39m
     [90m 485 |[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:482:36)

  ● ProfileAnalyzer › error handling › should handle undefined profile

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 485 |[39m
     [90m 486 |[39m     it([32m'should handle undefined profile'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 487 |[39m       [36mawait[39m expect(profileAnalyzer[33m.[39manalyzeProfile(undefined [36mas[39m any))
     [90m     |[39m                                    [31m[1m^[22m[39m
     [90m 488 |[39m         [33m.[39mrejects[33m.[39mtoThrow()[33m;[39m
     [90m 489 |[39m     })[33m;[39m
     [90m 490 |[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:487:36)

  ● ProfileAnalyzer › error handling › should handle invalid profile structure

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 492 |[39m       [36mconst[39m invalidProfile [33m=[39m { invalid[33m:[39m [32m'structure'[39m }[33m;[39m
     [90m 493 |[39m
    [31m[1m>[22m[39m[90m 494 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(invalidProfile [36mas[39m any)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 495 |[39m
     [90m 496 |[39m       expect(result[33m.[39mcompleteness)[33m.[39mtoBe([35m0[39m)[33m;[39m
     [90m 497 |[39m       expect(result[33m.[39mweaknesses[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:494:44)

  ● ProfileAnalyzer › error handling › should handle missing experience array

    expect(received).not.toThrow()

    Error name:    "TypeError"
    Error message: "profileAnalyzer.calculateCompleteness is not a function"

        [0m [90m 504 |[39m       }[33m;[39m
         [90m 505 |[39m
        [31m[1m>[22m[39m[90m 506 |[39m       expect(() [33m=>[39m profileAnalyzer[33m.[39mcalculateCompleteness(profileWithoutExperienceArray))
         [90m     |[39m                                    [31m[1m^[22m[39m
         [90m 507 |[39m         [33m.[39mnot[33m.[39mtoThrow()[33m;[39m
         [90m 508 |[39m     })[33m;[39m
         [90m 509 |[39m   })[33m;[39m[0m

      at calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:506:36)
      at Object.<anonymous> (node_modules/expect/build/index.js:1824:9)
      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:2235:93)
      at Object.toThrow (tests/services/matching/profile-analyzer.test.ts:507:14)
      at Object.toThrow (tests/services/matching/profile-analyzer.test.ts:507:14)

  ● ProfileAnalyzer › performance › should analyze profile within performance threshold

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 513 |[39m       [36mconst[39m startTime [33m=[39m [33mDate[39m[33m.[39mnow()[33m;[39m
     [90m 514 |[39m
    [31m[1m>[22m[39m[90m 515 |[39m       [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(mockProfile)[33m;[39m
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 516 |[39m
     [90m 517 |[39m       [36mconst[39m duration [33m=[39m [33mDate[39m[33m.[39mnow() [33m-[39m startTime[33m;[39m
     [90m 518 |[39m       expect(duration)[33m.[39mtoBeLessThan([35m1000[39m)[33m;[39m [90m// Should complete within 1 second[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:515:29)

  ● ProfileAnalyzer › performance › should handle large profile efficiently

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 537 |[39m       [36mconst[39m startTime [33m=[39m [33mDate[39m[33m.[39mnow()[33m;[39m
     [90m 538 |[39m
    [31m[1m>[22m[39m[90m 539 |[39m       [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(largeProfile)[33m;[39m
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 540 |[39m
     [90m 541 |[39m       [36mconst[39m duration [33m=[39m [33mDate[39m[33m.[39mnow() [33m-[39m startTime[33m;[39m
     [90m 542 |[39m       expect(duration)[33m.[39mtoBeLessThan([35m2000[39m)[33m;[39m [90m// Should complete within 2 seconds[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:539:29)

A worker process has failed to exit gracefully and has been force exited. This is likely caused by tests leaking due to improper teardown. Try running with --detectOpenHandles to find leaks. Active timers can also cause this, ensure that .unref() was called on them.
Summary of all failing tests
FAIL tests/e2e/matching-user-journey.test.ts
  ● Test suite failed to run

      [31mx[0m Expected ',', got '$'
         ,-[[36;1;4mE:\projects\jobfinders_mvp\tests\e2e\matching-user-journey.test.ts[0m:526:1]
     [2m523[0m |   }
     [2m524[0m | 
     [2m525[0m |   async function step_setupCompanyProfile() {
     [2m526[0m |     await page.goto(`${TEST_BASE_URL}/employer/profile`);
         : [35;1m                     ^[0m
     [2m527[0m | 
     [2m528[0m |     await page.fill('[data-testid="company-description"]', 'We are an innovative technology company focused on creating cutting-edge solutions.');
     [2m529[0m |     await page.fill('[data-testid="company-website"]', 'https://testcompany.com');
         `----


    Caused by:
        Syntax Error

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)

FAIL tests/ml/model-accuracy.test.ts
  ● Test suite failed to run

      [31mx[0m Expected ';', got ')'
         ,-[[36;1;4mE:\projects\jobfinders_mvp\src\lib\scoring\algorithms.ts[0m:849:1]
     [2m846[0m |     } else {
     [2m847[0m |       // Candidate salary is above job range
     [2m848[0m |       const excess = (candidateMin - jobMax) / candidateMin;
     [2m849[0m |       return Math.max(0, 1 - excess * 0.5));
         : [35;1m                                          ^[0m
     [2m850[0m |     }
     [2m851[0m |   }
     [2m852[0m | }
         `----


    Caused by:
        Syntax Error

    [0m [90m 19 |[39m   [33mLocationMatcher[39m[33m,[39m
     [90m 20 |[39m   [33mPreferencesMatcher[39m[33m,[39m
    [31m[1m>[22m[39m[90m 21 |[39m   [33mSalaryMatcher[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 22 |[39m } [36mfrom[39m [32m'@/lib/scoring/algorithms'[39m[33m;[39m
     [90m 23 |[39m [36mimport[39m { [33mExplanationGenerator[39m } [36mfrom[39m [32m'@/lib/scoring/explanations'[39m[33m;[39m
     [90m 24 |[39m [36mimport[39m { logger } [36mfrom[39m [32m'@/lib/logging/logger'[39m[33m;[39m[0m

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)
      at Object.<anonymous> (src/services/matching/scoring-engine.ts:21:21)
      at Object.<anonymous> (tests/ml/model-accuracy.test.ts:40:24)

FAIL __tests__/integration/resume-api.test.ts
  ● Test suite failed to run

    Cannot find module 'openai' from '__tests__/integration/resume-api.test.ts'

    [0m [90m 16 |[39m
     [90m 17 |[39m [90m// Mock OpenAI[39m
    [31m[1m>[22m[39m[90m 18 |[39m jest[33m.[39mmock([32m'openai'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 19 |[39m   [33mOpenAI[39m[33m:[39m jest[33m.[39mfn()[33m.[39mmockImplementation(() [33m=>[39m ({
     [90m 20 |[39m     chat[33m:[39m {
     [90m 21 |[39m       completions[33m:[39m {[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (__tests__/integration/resume-api.test.ts:18:6)

FAIL __tests__/integration/jobs-api.test.ts
  ● Test suite failed to run

    Cannot find module 'msw/node' from '__tests__/test-utils/server.ts'

    Require stack:
      __tests__/test-utils/server.ts
      __tests__/integration/jobs-api.test.ts

    [0m [90m 29 |[39m   [90m// Close the server after all tests[39m
     [90m 30 |[39m   afterAll(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 31 |[39m     testServer[33m.[39mclose()
     [90m    |[39m               [31m[1m^[22m[39m
     [90m 32 |[39m   })
     [90m 33 |[39m }
     [90m 34 |[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.<anonymous> (__tests__/test-utils/server.ts:31:15)
      at Object.<anonymous> (__tests__/integration/jobs-api.test.ts:6:17)

FAIL tests/saved-jobs/page.test.tsx
  ● SavedJobsPage › Authentication › redirects unauthenticated users to sign in

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Authentication › redirects non-seeker users to dashboard

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Authentication › renders page for authenticated seeker users

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Loading State › shows loading skeleton while fetching data

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Empty State › displays empty state when no saved jobs

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job List Display › displays saved jobs with correct information

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job List Display › displays job status badges correctly

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job List Display › displays remote policy badge for remote jobs

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Search and Filter Functionality › filters jobs by search term

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Search and Filter Functionality › filters jobs by status

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Search and Filter Functionality › sorts jobs by different criteria

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job Selection and Bulk Operations › allows selecting individual jobs

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job Selection and Bulk Operations › allows selecting all jobs

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job Management › opens edit dialog when edit is clicked

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Job Management › removes job when remove is clicked

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Export Functionality › exports selected jobs as CSV

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Collection Management › opens create collection dialog

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Collection Management › creates new collection with valid data

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Error Handling › handles API errors gracefully

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Accessibility › has proper ARIA labels and roles

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

  ● SavedJobsPage › Accessibility › supports keyboard navigation

    TypeError: Cannot read properties of undefined (reading 'mockReturnValue')

    [0m [90m 39 |[39m     push[33m:[39m mockPush
     [90m 40 |[39m   })
    [31m[1m>[22m[39m[90m 41 |[39m   [33m;[39m(toast [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue({
     [90m    |[39m                         [31m[1m^[22m[39m
     [90m 42 |[39m     toast[33m:[39m mockToast
     [90m 43 |[39m   })
     [90m 44 |[39m })[0m

      at Object.mockReturnValue (tests/saved-jobs/page.test.tsx:41:25)

FAIL __tests__/pages/jobs-page.test.tsx
  ● JobsPage › Basic Rendering › renders the jobs listing page with main elements

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Basic Rendering › renders the view toggle buttons

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Basic Rendering › renders filters sidebar

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Basic Rendering › renders search history component

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Search Functionality › allows users to type in the search input

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Search Functionality › triggers search when Enter key is pressed

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Search Functionality › triggers search when search button is clicked

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Search Functionality › displays loading state during search

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to set location filter

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to select category filter

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to set salary range

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to select experience level

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to toggle remote work filter

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Filter Functionality › allows users to clear all filters

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Results Display › displays jobs when search results are available

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Results Display › displays empty state when no jobs found

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Results Display › displays error state when search fails

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Results Display › displays pagination when multiple pages exist

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › View Modes › allows users to switch between grid and list views

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Search History Integration › allows users to select from search history

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Active Filters Display › displays active filter badges

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Active Filters Display › allows users to remove individual filters

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Accessibility › has proper ARIA labels and roles

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Accessibility › supports keyboard navigation

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Error Handling › handles API errors gracefully

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Error Handling › allows retry after error

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

  ● JobsPage › Responsive Design › shows mobile filters button on small screens

    TypeError: _navigation.useRouter.mockReturnValue is not a function

    [0m [90m 149 |[39m   jest[33m.[39mclearAllMocks()
     [90m 150 |[39m
    [31m[1m>[22m[39m[90m 151 |[39m   [33m;[39m(useRouter [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockRouter)
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 152 |[39m   [33m;[39m(useSearchParams [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockSearchParams)
     [90m 153 |[39m   [33m;[39m(usePathname [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockPathname)
     [90m 154 |[39m   [33m;[39m(useJobSearch [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockReturnValue(mockJobSearchHook)[0m

      at Object.mockReturnValue (__tests__/pages/jobs-page.test.tsx:151:29)

FAIL __tests__/resume-builder/components/ResumeEditor.test.tsx
  ● Test suite failed to run

    Configuration error:

    Could not locate module @/hooks/use-resume-editor mapped as:
    E:\projects\jobfinders_mvp\src\$1.

    Please check your configuration for these entries:
    {
      "moduleNameMapper": {
        "/^@\/(.*)$/": "E:\projects\jobfinders_mvp\src\$1"
      },
      "resolver": undefined
    }

    [0m [90m  7 |[39m [90m// Mock the hook[39m
     [90m  8 |[39m jest[33m.[39mmock([32m'@/hooks/use-real-time-suggestions'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m  9 |[39m jest[33m.[39mmock([32m'@/hooks/use-resume-editor'[39m[33m,[39m () [33m=>[39m ({
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 10 |[39m   useResumeEditor[33m:[39m () [33m=>[39m ({
     [90m 11 |[39m     resumeData[33m:[39m {
     [90m 12 |[39m       personal[33m:[39m {[0m

      at createNoMappedModuleFoundError (node_modules/jest-resolve/build/index.js:1117:17)
      at Object.mock (__tests__/resume-builder/components/ResumeEditor.test.tsx:9:6)

FAIL __tests__/resume-builder/services/suggestion-engine.test.ts
  ● Test suite failed to run

    Cannot find module 'openai' from '__tests__/resume-builder/services/suggestion-engine.test.ts'

    [0m [90m 2 |[39m
     [90m 3 |[39m [90m// Mock OpenAI[39m
    [31m[1m>[22m[39m[90m 4 |[39m jest[33m.[39mmock([32m'openai'[39m[33m,[39m () [33m=>[39m ({
     [90m   |[39m      [31m[1m^[22m[39m
     [90m 5 |[39m   [33mOpenAI[39m[33m:[39m jest[33m.[39mfn()[33m.[39mmockImplementation(() [33m=>[39m ({
     [90m 6 |[39m     chat[33m:[39m {
     [90m 7 |[39m       completions[33m:[39m {[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (__tests__/resume-builder/services/suggestion-engine.test.ts:4:6)

FAIL tests/api/saved-jobs/export/route.test.ts
  ● Test suite failed to run

    ReferenceError: Request is not defined

    [0m [90m 18 |[39m   }[33m,[39m
     [90m 19 |[39m   savedJob[33m:[39m {
    [31m[1m>[22m[39m[90m 20 |[39m     findMany[33m:[39m jest[33m.[39mfn()
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 21 |[39m   }
     [90m 22 |[39m }))
     [90m 23 |[39m[0m

      at Object.Request (node_modules/next/src/server/web/spec-extension/request.ts:14:34)
      at Object.<anonymous> (node_modules/next/server.js:2:16)
      at Object.<anonymous> (tests/api/saved-jobs/export/route.test.ts:20:17)

FAIL __tests__/resume-builder/services/batch-processor.test.ts
  ● BatchProcessor › createJob › should create a batch job for resume analysis

    expect(received).toBe(expected) // Object.is equality

    Expected: "queued"
    Received: "processing"

    [0m [90m 67 |[39m       expect(job[33m.[39mid)[33m.[39mtoBeDefined()[33m;[39m
     [90m 68 |[39m       expect(job[33m.[39mtype)[33m.[39mtoBe([32m'resume_analysis'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 69 |[39m       expect(job[33m.[39mstatus)[33m.[39mtoBe([32m'queued'[39m)[33m;[39m
     [90m    |[39m                          [31m[1m^[22m[39m
     [90m 70 |[39m       expect(job[33m.[39mtotalItems)[33m.[39mtoBe([35m2[39m)[33m;[39m
     [90m 71 |[39m       expect(job[33m.[39mcreatedBy)[33m.[39mtoBe([32m'user-1'[39m)[33m;[39m
     [90m 72 |[39m       expect(job[33m.[39mmetadata[33m.[39mpriority)[33m.[39mtoBe([35m50[39m)[33m;[39m[0m

      at Object.toBe (__tests__/resume-builder/services/batch-processor.test.ts:69:26)

  ● BatchProcessor › cancelJob › should cancel a queued job

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

    [0m [90m 250 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m batchProcessor[33m.[39mcancelJob([32m'job-1'[39m[33m,[39m [32m'user-1'[39m)[33m;[39m
     [90m 251 |[39m
    [31m[1m>[22m[39m[90m 252 |[39m       expect(result)[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m     |[39m                      [31m[1m^[22m[39m
     [90m 253 |[39m     })[33m;[39m
     [90m 254 |[39m
     [90m 255 |[39m     it([32m'should not cancel job if user is not the owner'[39m[33m,[39m [36masync[39m () [33m=>[39m {[0m

      at Object.toBe (__tests__/resume-builder/services/batch-processor.test.ts:252:22)

  ● BatchProcessor › job processing › should process resume analysis jobs

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: {"certifications": [], "education": [], "experience": [], "languages": [], "professionalTitle": "Software Engineer", "projects": [], "resumeId": "resume-1", "summary": "Experienced developer"}

    Number of calls: 0

    [0m [90m 325 |[39m       [36mawait[39m [36mnew[39m [33mPromise[39m(resolve [33m=>[39m setTimeout(resolve[33m,[39m [35m100[39m))[33m;[39m
     [90m 326 |[39m
    [31m[1m>[22m[39m[90m 327 |[39m       expect(aiAnalyzer[33m.[39manalyzeResume)[33m.[39mtoHaveBeenCalledWith(mockResume)[33m;[39m
     [90m     |[39m                                        [31m[1m^[22m[39m
     [90m 328 |[39m     })[33m;[39m
     [90m 329 |[39m
     [90m 330 |[39m     it([32m'should handle processing errors'[39m[33m,[39m [36masync[39m () [33m=>[39m {[0m

      at Object.toHaveBeenCalledWith (__tests__/resume-builder/services/batch-processor.test.ts:327:40)

  ● BatchProcessor › job processing › should handle processing errors

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: ObjectContaining {"data": ObjectContaining {"error": StringContaining "AI service error", "status": "failed"}, "where": {"id": "job-1"}}
    Received
           1: {"data": {"completedAt": undefined, "error": undefined, "processedProfiles": 0, "progress": 0, "results": undefined, "startedAt": 2025-10-08T00:39:20.618Z, "status": "processing"}, "where": {"id": "batch_1759883960618_jx3hy8m2d"}}
           2: {"data": {"completedAt": 2025-10-08T00:39:20.620Z, "error": "Assignment to constant variable.", "processedProfiles": 0, "progress": 0, "results": undefined, "startedAt": 2025-10-08T00:39:20.618Z, "status": "failed"}, "where": {"id": "batch_1759883960618_jx3hy8m2d"}}

    Number of calls: 2

    [0m [90m 359 |[39m
     [90m 360 |[39m       [90m// Job should be marked as failed[39m
    [31m[1m>[22m[39m[90m 361 |[39m       expect(prisma[33m.[39mbatchMatchJob[33m.[39mupdate)[33m.[39mtoHaveBeenCalledWith(
     [90m     |[39m                                           [31m[1m^[22m[39m
     [90m 362 |[39m         expect[33m.[39mobjectContaining({
     [90m 363 |[39m           where[33m:[39m { id[33m:[39m [32m'job-1'[39m }[33m,[39m
     [90m 364 |[39m           data[33m:[39m expect[33m.[39mobjectContaining({[0m

      at Object.toHaveBeenCalledWith (__tests__/resume-builder/services/batch-processor.test.ts:361:43)

  ● BatchProcessor › integration tests › should handle complete job lifecycle

    expect(received).toBe(expected) // Object.is equality

    Expected: "queued"
    Received: "processing"

    [0m [90m 389 |[39m
     [90m 390 |[39m       [36mconst[39m job [33m=[39m [36mawait[39m batchProcessor[33m.[39mcreateJob(request)[33m;[39m
    [31m[1m>[22m[39m[90m 391 |[39m       expect(job[33m.[39mstatus)[33m.[39mtoBe([32m'queued'[39m)[33m;[39m
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 392 |[39m
     [90m 393 |[39m       [90m// 2. Get job status[39m
     [90m 394 |[39m       (prisma[33m.[39mbatchMatchJob[33m.[39mfindUnique [36mas[39m jest[33m.[39m[33mMock[39m)[33m.[39mmockResolvedValue({[0m

      at Object.toBe (__tests__/resume-builder/services/batch-processor.test.ts:391:26)

FAIL tests/api/saved-jobs/[id]/route.test.ts
  ● Test suite failed to run

    ReferenceError: Request is not defined

    [0m [90m 20 |[39m     findUnique[33m:[39m jest[33m.[39mfn()[33m,[39m
     [90m 21 |[39m     update[33m:[39m jest[33m.[39mfn()[33m,[39m
    [31m[1m>[22m[39m[90m 22 |[39m     [36mdelete[39m[33m:[39m jest[33m.[39mfn()
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 23 |[39m   }
     [90m 24 |[39m }))
     [90m 25 |[39m[0m

      at Object.Request (node_modules/next/src/server/web/spec-extension/request.ts:14:34)
      at Object.<anonymous> (node_modules/next/server.js:2:16)
      at Object.<anonymous> (tests/api/saved-jobs/[id]/route.test.ts:22:17)

FAIL tests/api/saved-jobs/route.test.ts
  ● Test suite failed to run

    ReferenceError: Request is not defined

    [0m [90m 23 |[39m   }[33m,[39m
     [90m 24 |[39m   job[33m:[39m {
    [31m[1m>[22m[39m[90m 25 |[39m     findUnique[33m:[39m jest[33m.[39mfn()
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 26 |[39m   }
     [90m 27 |[39m }))
     [90m 28 |[39m[0m

      at Object.Request (node_modules/next/src/server/web/spec-extension/request.ts:14:34)
      at Object.<anonymous> (node_modules/next/server.js:2:16)
      at Object.<anonymous> (tests/api/saved-jobs/route.test.ts:25:17)

FAIL src/app/saved/__tests__/page.test.tsx
  ● SavedJobsPage › should render saved jobs page correctly

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:70:11)

  ● SavedJobsPage › should display saved jobs

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:79:11)

  ● SavedJobsPage › should show empty state when no saved jobs

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:93:11)

  ● SavedJobsPage › should show loading state

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:105:11)

  ● SavedJobsPage › should show error state

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:116:11)

  ● SavedJobsPage › should filter jobs by search term

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:123:11)

  ● SavedJobsPage › should filter jobs by status

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:133:11)

  ● SavedJobsPage › should sort jobs

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:143:11)

  ● SavedJobsPage › should select jobs for bulk operations

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:154:11)

  ● SavedJobsPage › should select all jobs

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:163:11)

  ● SavedJobsPage › should handle job removal

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:178:11)

  ● SavedJobsPage › should handle job editing

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:198:11)

  ● SavedJobsPage › should export jobs

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:229:11)

  ● SavedJobsPage › should create new collection

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:248:11)

  ● SavedJobsPage › should redirect non-seeker users

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "/dashboard"

    Number of calls: 0

    [0m [90m 282 |[39m     render([33m<[39m[33mSavedJobsPage[39m [33m/[39m[33m>[39m)
     [90m 283 |[39m
    [31m[1m>[22m[39m[90m 284 |[39m     expect(mockPush)[33m.[39mtoHaveBeenCalledWith([32m'/dashboard'[39m)
     [90m     |[39m                      [31m[1m^[22m[39m
     [90m 285 |[39m   })
     [90m 286 |[39m
     [90m 287 |[39m   it([32m'should redirect unauthenticated users'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toHaveBeenCalledWith (src/app/saved/__tests__/page.test.tsx:284:22)

  ● SavedJobsPage › should redirect unauthenticated users

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "/auth/signin"

    Number of calls: 0

    [0m [90m 300 |[39m     render([33m<[39m[33mSavedJobsPage[39m [33m/[39m[33m>[39m)
     [90m 301 |[39m
    [31m[1m>[22m[39m[90m 302 |[39m     expect(mockPush)[33m.[39mtoHaveBeenCalledWith([32m'/auth/signin'[39m)
     [90m     |[39m                      [31m[1m^[22m[39m
     [90m 303 |[39m   })
     [90m 304 |[39m
     [90m 305 |[39m   it([32m'should display job status badges'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.toHaveBeenCalledWith (src/app/saved/__tests__/page.test.tsx:302:22)

  ● SavedJobsPage › should display job status badges

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:306:11)

  ● SavedJobsPage › should display job notes

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:313:11)

  ● SavedJobsPage › should clear filters

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:319:11)

  ● SavedJobsPage › should have responsive design

    TypeError: Cannot destructure property 'data' of '(0 , _reactquery.useQuery)(...)' as it is undefined.

    [0m [90m 89 |[39m
     [90m 90 |[39m   [36mconst[39m {
    [31m[1m>[22m[39m[90m 91 |[39m     data[33m:[39m user[33m,[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 92 |[39m     isLoading[33m,[39m
     [90m 93 |[39m     isError[33m,[39m
     [90m 94 |[39m     error[33m,[39m[0m

      at user (src/hooks/useCurrentUser.ts:91:11)
      at NavigationHeader (src/components/layout/navigation-header.tsx:42:21)
      at Object.react_stack_bottom_frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:860:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at Object.<anonymous> (src/app/saved/__tests__/page.test.tsx:331:11)

FAIL src/hooks/__tests__/use-saved-jobs.test.ts
  ● useSavedJobs › should handle unsave job correctly

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: "/api/saved-jobs/1", {"method": "DELETE"}
    Received
           1: "/api/saved-jobs"
           2
              "/api/saved-jobs/1",
              Object {
            +   "headers": Object {
            +     "Content-Type": "application/json",
            +   },
                "method": "DELETE",
              },

    Number of calls: 2

    [0m [90m 152 |[39m     })
     [90m 153 |[39m
    [31m[1m>[22m[39m[90m 154 |[39m     expect(fetch)[33m.[39mtoHaveBeenCalledWith([32m'/api/saved-jobs/1'[39m[33m,[39m {
     [90m     |[39m                   [31m[1m^[22m[39m
     [90m 155 |[39m       method[33m:[39m [32m'DELETE'[39m
     [90m 156 |[39m     })
     [90m 157 |[39m[0m

      at Object.toHaveBeenCalledWith (src/hooks/__tests__/use-saved-jobs.test.ts:154:19)

  ● useSavedJobs › should handle API errors gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: "Failed to fetch"
    Received: "Failed to fetch saved jobs"

    [0m [90m 245 |[39m     })
     [90m 246 |[39m
    [31m[1m>[22m[39m[90m 247 |[39m     expect(result[33m.[39mcurrent[33m.[39merror)[33m.[39mtoBe([32m'Failed to fetch'[39m)
     [90m     |[39m                                  [31m[1m^[22m[39m
     [90m 248 |[39m     expect(mockToast[33m.[39mtoast)[33m.[39mnot[33m.[39mtoHaveBeenCalled()
     [90m 249 |[39m   })
     [90m 250 |[39m[0m

      at Object.toBe (src/hooks/__tests__/use-saved-jobs.test.ts:247:34)

  ● useSavedJobs › should export saved jobs

    Target container is not a DOM element.

    [0m [90m 282 |[39m     global[33m.[39mdocument[33m.[39mbody[33m.[39mremoveChild [33m=[39m jest[33m.[39mfn()
     [90m 283 |[39m
    [31m[1m>[22m[39m[90m 284 |[39m     [36mconst[39m { result } [33m=[39m renderHook(() [33m=>[39m useSavedJobs())
     [90m     |[39m                                  [31m[1m^[22m[39m
     [90m 285 |[39m
     [90m 286 |[39m     [36mawait[39m waitFor(() [33m=>[39m {
     [90m 287 |[39m       expect(result[33m.[39mcurrent[33m.[39msavedJobs)[33m.[39mtoEqual(mockJobs)[0m

      at Object.process.env.NODE_ENV.exports.createRoot (node_modules/react-dom/cjs/react-dom-client.development.js:24881:15)
      at createConcurrentRoot (node_modules/@testing-library/react/dist/pure.js:147:27)
      at render (node_modules/@testing-library/react/dist/pure.js:266:12)
      at renderHook (node_modules/@testing-library/react/dist/pure.js:340:7)
      at Object.<anonymous> (src/hooks/__tests__/use-saved-jobs.test.ts:284:34)

FAIL src/__tests__/applications.test.tsx
  ● Test suite failed to run

      [31mx[0m Unexpected token `ApplicationsPage`. Expected jsx identifier
         ,-[[36;1;4mE:\projects\jobfinders_mvp\src\__tests__\applications.test.tsx[0m:224:1]
     [2m221[0m |       status: 'unauthenticated',
     [2m222[0m |     })
     [2m223[0m | 
     [2m224[0m |     render(<ApplicationsPage>)
         : [35;1m            ^^^^^^^^^^^^^^^^[0m
     [2m225[0m | 
     [2m226[0m |     expect(mockPush).toHaveBeenCalledWith('/auth/signin')
     [2m227[0m |   })
         `----


    Caused by:
        Syntax Error

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)

FAIL tests/performance/matching-load.test.ts (6.567 s)
  ● Matching System Load Testing › API Endpoint Performance › should handle concurrent matching requests

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › API Endpoint Performance › should handle batch matching operations

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › API Endpoint Performance › should handle recommendation requests

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › API Endpoint Performance › should handle profile analysis requests

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Database Performance › should handle concurrent database operations

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Database Performance › should handle complex query operations

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Cache Performance › should handle high cache hit rates

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Cache Performance › should handle cache misses gracefully

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Memory and Resource Usage › should maintain stable memory usage under load

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Scalability Tests › should scale linearly with increased load

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)

  ● Matching System Load Testing › Scalability Tests › should handle sustained load without degradation

    thrown: "Exceeded timeout of 5000 ms for a hook.
    Add a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."

    [0m [90m 40 |[39m   [36mlet[39m testResults[33m:[39m [33mLoadTestResult[39m[] [33m=[39m [][33m;[39m
     [90m 41 |[39m
    [31m[1m>[22m[39m[90m 42 |[39m   beforeAll([36masync[39m () [33m=>[39m {
     [90m    |[39m   [31m[1m^[22m[39m
     [90m 43 |[39m     prisma [33m=[39m [36mnew[39m [33mPrismaClient[39m()[33m;[39m
     [90m 44 |[39m
     [90m 45 |[39m     [90m// Setup test data[39m[0m

      at beforeAll (tests/performance/matching-load.test.ts:42:3)
      at Object.describe (tests/performance/matching-load.test.ts:38:1)


  ● Test suite failed to run

    ReferenceError: setImmediate is not defined

    [0m [90m 48 |[39m
     [90m 49 |[39m   afterAll([36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 50 |[39m     [36mawait[39m prisma[33m.[39m$disconnect()[33m;[39m
     [90m    |[39m     [31m[1m^[22m[39m
     [90m 51 |[39m   })[33m;[39m
     [90m 52 |[39m
     [90m 53 |[39m   describe([32m'API Endpoint Performance'[39m[33m,[39m () [33m=>[39m {[0m

      at node_modules/@prisma/client/src/runtime/core/engines/library/LibraryEngine.ts:469:32
      at r (node_modules/@prisma/client/src/runtime/core/engines/library/LibraryEngine.ts:469:13)
      at Object.callback [as runInChildSpan] (node_modules/@prisma/client/src/runtime/core/tracing/TracingHelper.ts:24:12)
      at Co.runInChildSpan (node_modules/@prisma/client/src/runtime/core/tracing/TracingHelper.ts:49:42)
      at Gr.stop (node_modules/@prisma/client/src/runtime/core/engines/library/LibraryEngine.ts:495:54)
      at Proxy.$disconnect (node_modules/@prisma/client/src/runtime/getPrismaClient.ts:473:9)
      at Object.<anonymous> (tests/performance/matching-load.test.ts:50:5)

FAIL src/components/jobs/__tests__/job-card.test.tsx
  ● JobCard › should render job information correctly

    TestingLibraryElementError: Unable to find an element with the text: 500,000 - 800,000 ZAR. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

    Ignored nodes: comments, script, style
    [36m<body>[39m
      [36m<div>[39m
        [36m<div[39m
          [33mclass[39m=[32m"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm p-6 hover:border-primary transition-colors"[39m
          [33mdata-slot[39m=[32m"card"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-start gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-12 h-12 relative flex-shrink-0"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"w-12 h-12 rounded-lg bg-muted flex items-center justify-center"[39m
              [36m>[39m
                [36m<svg[39m
                  [33maria-hidden[39m=[32m"true"[39m
                  [33mclass[39m=[32m"lucide lucide-building2 lucide-building-2 w-6 h-6 text-muted-foreground"[39m
                  [33mfill[39m=[32m"none"[39m
                  [33mheight[39m=[32m"24"[39m
                  [33mstroke[39m=[32m"currentColor"[39m
                  [33mstroke-linecap[39m=[32m"round"[39m
                  [33mstroke-linejoin[39m=[32m"round"[39m
                  [33mstroke-width[39m=[32m"2"[39m
                  [33mviewBox[39m=[32m"0 0 24 24"[39m
                  [33mwidth[39m=[32m"24"[39m
                  [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
                [36m>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M10 6h4"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M10 10h4"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M10 14h4"[39m
                  [36m/>[39m
                  [36m<path[39m
                    [33md[39m=[32m"M10 18h4"[39m
                  [36m/>[39m
                [36m</svg>[39m
              [36m</div>[39m
            [36m</div>[39m
            [36m<div[39m
              [33mclass[39m=[32m"flex-grow"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-start justify-between gap-4"[39m
              [36m>[39m
                [36m<div>[39m
                  [36m<a[39m
                    [33mhref[39m=[32m"/jobs/1"[39m
                  [36m>[39m
                    [0mSoftware Developer[0m
                  [36m</a>[39m
                  [36m<div[39m
                    [33mclass[39m=[32m"flex items-center gap-2 text-muted-foreground"[39m
                  [36m>[39m
                    [36m<span[39m
                      [33mclass[39m=[32m"flex items-center gap-1"[39m
                    [36m>[39m
                      [36m<svg[39m
                        [33maria-hidden[39m=[32m"true"[39m
                        [33mclass[39m=[32m"lucide lucide-building2 lucide-building-2 w-4 h-4"[39m
                        [33mfill[39m=[32m"none"[39m
                        [33mheight[39m=[32m"24"[39m
                        [33mstroke[39m=[32m"currentColor"[39m
                        [33mstroke-linecap[39m=[32m"round"[39m
                        [33mstroke-linejoin[39m=[32m"round"[39m
                        [33mstroke-width[39m=[32m"2"[39m
                        [33mviewBox[39m=[32m"0 0 24 24"[39m
                        [33mwidth[39m=[32m"24"[39m
                        [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
                      [36m>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M10 6h4"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M10 10h4"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M10 14h4"[39m
                        [36m/>[39m
                        [36m<path[39m
                          [33md[39m=[32m"M10 18h4"[39m
                        [36m/>[39m
                      [36m</svg>[39m
                      [0mTech Company[0m
                    [36m</span>[39m
                    [36m<span[39m
                      [33mclass[39m=[32m"inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent [a&]:hover:bg-secondary/90 bg-blue-100 text-blue-800"[39m
                      [33mdata-slot[39m=[32m"badge"[39m
                    [36m>[39m
                      [0mVerified[0m
                    [36m</span>[39m
                  [36m</div>[39m
                [36m</div>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground hidden sm:flex"[39m
                  [33mdata-slot[39m=[32m"badge"[39m
                  [33mstyle[39m=[32m"background-color: rgb(59, 130, 246); color: rgb(255, 255, 255);"[39m
                [36m>[39m
                  [36m<span[39m
                    [33mclass[39m=[32m"mr-1"[39m
                  [36m>[39m
                    [0m��[0m
                  [36m</span>[39m
                  [0mEngineering[0m
                [36m</span>[39m
              [36m</div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"flex items-center gap-1"[39m
                [36m>[39m
                  [36m<svg[39m
                    [33maria-hidden[39m=[32m"true"[39m
                    [33mclass[39m=[32m"lucide lucide-map-pin w-4 h-4"[39m
                    [33mfill[39m=[32m"none"[39m
            ...

    [0m [90m 76 |[39m     expect(screen[33m.[39mgetByText([32m'15 applicants'[39m))[33m.[39mtoBeInTheDocument()
     [90m 77 |[39m     expect(screen[33m.[39mgetByText([32m'Mid-level'[39m))[33m.[39mtoBeInTheDocument()
    [31m[1m>[22m[39m[90m 78 |[39m     expect(screen[33m.[39mgetByText([32m'500,000 - 800,000 ZAR'[39m))[33m.[39mtoBeInTheDocument()
     [90m    |[39m                   [31m[1m^[22m[39m
     [90m 79 |[39m   })
     [90m 80 |[39m
     [90m 81 |[39m   it([32m'should show bookmark button'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.getElementError (node_modules/@testing-library/dom/dist/config.js:37:19)
      at node_modules/@testing-library/dom/dist/query-helpers.js:76:38
      at node_modules/@testing-library/dom/dist/query-helpers.js:52:17
      at node_modules/@testing-library/dom/dist/query-helpers.js:95:19
      at Object.getByText (src/components/jobs/__tests__/job-card.test.tsx:78:19)

  ● JobCard › should handle unsave functionality when no onToggleSave provided

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    - Expected
    + Received

      "/api/saved-jobs/1",
      Object {
    +   "headers": Object {
    +     "Content-Type": "application/json",
    +   },
        "method": "DELETE",
      },

    Number of calls: 1

    Ignored nodes: comments, script, style
    [36m<html>[39m
      [36m<head />[39m
      [36m<body>[39m
        [36m<div>[39m
          [36m<div[39m
            [33mclass[39m=[32m"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm p-6 hover:border-primary transition-colors"[39m
            [33mdata-slot[39m=[32m"card"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"flex items-start gap-4"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"w-12 h-12 relative flex-shrink-0"[39m
              [36m>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-12 h-12 rounded-lg bg-muted flex items-center justify-center"[39m
                [36m>[39m
                  [36m<svg[39m
                    [33maria-hidden[39m=[32m"true"[39m
                    [33mclass[39m=[32m"lucide lucide-building2 lucide-building-2 w-6 h-6 text-muted-foreground"[39m
                    [33mfill[39m=[32m"none"[39m
                    [33mheight[39m=[32m"24"[39m
                    [33mstroke[39m=[32m"currentColor"[39m
                    [33mstroke-linecap[39m=[32m"round"[39m
                    [33mstroke-linejoin[39m=[32m"round"[39m
                    [33mstroke-width[39m=[32m"2"[39m
                    [33mviewBox[39m=[32m"0 0 24 24"[39m
                    [33mwidth[39m=[32m"24"[39m
                    [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
                  [36m>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M10 6h4"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M10 10h4"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M10 14h4"[39m
                    [36m/>[39m
                    [36m<path[39m
                      [33md[39m=[32m"M10 18h4"[39m
                    [36m/>[39m
                  [36m</svg>[39m
                [36m</div>[39m
              [36m</div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex-grow"[39m
              [36m>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"flex items-start justify-between gap-4"[39m
                [36m>[39m
                  [36m<div>[39m
                    [36m<a[39m
                      [33mhref[39m=[32m"/jobs/1"[39m
                    [36m>[39m
                      [0mSoftware Developer[0m
                    [36m</a>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"flex items-center gap-2 text-muted-foreground"[39m
                    [36m>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"flex items-center gap-1"[39m
                      [36m>[39m
                        [36m<svg[39m
                          [33maria-hidden[39m=[32m"true"[39m
                          [33mclass[39m=[32m"lucide lucide-building2 lucide-building-2 w-4 h-4"[39m
                          [33mfill[39m=[32m"none"[39m
                          [33mheight[39m=[32m"24"[39m
                          [33mstroke[39m=[32m"currentColor"[39m
                          [33mstroke-linecap[39m=[32m"round"[39m
                          [33mstroke-linejoin[39m=[32m"round"[39m
                          [33mstroke-width[39m=[32m"2"[39m
                          [33mviewBox[39m=[32m"0 0 24 24"[39m
                          [33mwidth[39m=[32m"24"[39m
                          [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
                        [36m>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M10 6h4"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M10 10h4"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M10 14h4"[39m
                          [36m/>[39m
                          [36m<path[39m
                            [33md[39m=[32m"M10 18h4"[39m
                          [36m/>[39m
                        [36m</svg>[39m
                        [0mTech Company[0m
                      [36m</span>[39m
                      [36m<span[39m
                        [33mclass[39m=[32m"inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent [a&]:hover:bg-secondary/90 bg-blue-100 text-blue-800"[39m
                        [33mdata-slot[39m=[32m"badge"[39m
                      [36m>[39m
                        [0mVerified[0m
                      [36m</span>[39m
                    [36m</div>[39m
                  [36m</div>[39m
                  [36m<span[39m
                    [33mclass[39m=[32m"items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground hidden sm:flex"[39m
                    [33mdata-slot[39m=[32m"badge"[39m
                    [33mstyle[39m=[32m"background-color: rgb(59, 130, 246); color: rgb(255, 255, 255);"[39m
                  [36m>[39m
                    [36m<span[39m
                      [33mclass[39m=[32m"mr-1"[39m
                    [36m>[39m
                      [0m��[0m
                    [36m</span>[39m
                    [0mEngineering[0m
                  [36m</span>[39m
                [36m</div>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"[39m
                [36m>[39m
                  [36m<span[39m
      ...

    [0m [90m 142 |[39m
     [90m 143 |[39m     [36mawait[39m waitFor(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 144 |[39m       expect(fetch)[33m.[39mtoHaveBeenCalledWith([32m'/api/saved-jobs/1'[39m[33m,[39m {
     [90m     |[39m                     [31m[1m^[22m[39m
     [90m 145 |[39m         method[33m:[39m [32m'DELETE'[39m
     [90m 146 |[39m       })
     [90m 147 |[39m     })[0m

      at toHaveBeenCalledWith (src/components/jobs/__tests__/job-card.test.tsx:144:21)
      at runWithExpensiveErrorDiagnosticsDisabled (node_modules/@testing-library/dom/dist/config.js:47:12)
      at checkCallback (node_modules/@testing-library/dom/dist/wait-for.js:124:77)
      at checkRealTimersCallback (node_modules/@testing-library/dom/dist/wait-for.js:118:16)
      at Timeout.task [as _onTimeout] (node_modules/jsdom/lib/jsdom/browser/Window.js:579:19)

FAIL __tests__/hooks/useCurrentUser.test.ts
  ● useCurrentUser › Role-based Helpers › should correctly identify admin role

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

    [0m [90m 305 |[39m       [36mconst[39m { result } [33m=[39m renderHook(() [33m=>[39m useCurrentUser())
     [90m 306 |[39m
    [31m[1m>[22m[39m[90m 307 |[39m       expect(result[33m.[39mcurrent[33m.[39misJobSeeker)[33m.[39mtoBe([36mfalse[39m)
     [90m     |[39m                                          [31m[1m^[22m[39m
     [90m 308 |[39m       expect(result[33m.[39mcurrent[33m.[39misEmployer)[33m.[39mtoBe([36mfalse[39m)
     [90m 309 |[39m       expect(result[33m.[39mcurrent[33m.[39misAdmin)[33m.[39mtoBe([36mtrue[39m)
     [90m 310 |[39m     })[0m

      at Object.toBe (__tests__/hooks/useCurrentUser.test.ts:307:42)

FAIL src/services/notifications/__tests__/delivery-engine.test.ts
  ● Test suite failed to run

    Cannot find module 'bullmq' from 'src/lib/queue/event-queue.ts'

    [0m [90m 10 |[39m   concurrency[33m?[39m[33m:[39m number
     [90m 11 |[39m   maxRetries[33m?[39m[33m:[39m number
    [31m[1m>[22m[39m[90m 12 |[39m   retryDelay[33m?[39m[33m:[39m number
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 13 |[39m   removeOnComplete[33m?[39m[33m:[39m number
     [90m 14 |[39m   removeOnFail[33m?[39m[33m:[39m number
     [90m 15 |[39m }[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.<anonymous> (src/lib/queue/event-queue.ts:12:17)
      at Object.<anonymous> (src/services/notifications/delivery-engine.ts:21:21)
      at Object.<anonymous> (src/services/notifications/__tests__/delivery-engine.test.ts:10:25)

FAIL src/services/notifications/__tests__/channel-orchestrator.test.ts
  ● Test suite failed to run

      [31mx[0m Expected ';', '}' or <eof>
       ,-[[36;1;4mE:\projects\jobfinders_mvp\src\services\notifications\channel-orchestrator.ts[0m:1:1]
     [2m1[0m | dateimport { EventEmitter } from 'events'
       : [35;1m^^^^^|^^^^[0m[33;1m ^[0m
       :      [35;1m`-- [35;1mThis is the expression part of an expression statement[0m[0m
     [2m2[0m | import { db } from '@/lib/db'
     [2m3[0m | import { redis } from '@/lib/redis'
     [2m3[0m | import { EventQueueManager } from '@/lib/queue/event-queue'
       `----


    Caused by:
        Syntax Error

    [0m [90m 11 |[39m jest[33m.[39mmock([32m'../channels/email-channel'[39m)
     [90m 12 |[39m jest[33m.[39mmock([32m'../channels/sms-channel'[39m)
    [31m[1m>[22m[39m[90m 13 |[39m jest[33m.[39mmock([32m'../channels/push-channel'[39m)
     [90m    |[39m                              [31m[1m^[22m[39m
     [90m 14 |[39m jest[33m.[39mmock([32m'../channels/in-app-channel'[39m)
     [90m 15 |[39m jest[33m.[39mmock([32m'../analytics-engine'[39m)
     [90m 16 |[39m jest[33m.[39mmock([32m'@prisma/client'[39m)[0m

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)
      at Object.<anonymous> (src/services/notifications/__tests__/channel-orchestrator.test.ts:13:30)

FAIL tests/services/matching/scoring-engine.test.ts
  ● Test suite failed to run

      [31mx[0m Expected ';', got ')'
         ,-[[36;1;4mE:\projects\jobfinders_mvp\src\lib\scoring\algorithms.ts[0m:849:1]
     [2m846[0m |     } else {
     [2m847[0m |       // Candidate salary is above job range
     [2m848[0m |       const excess = (candidateMin - jobMax) / candidateMin;
     [2m849[0m |       return Math.max(0, 1 - excess * 0.5));
         : [35;1m                                          ^[0m
     [2m850[0m |     }
     [2m851[0m |   }
     [2m852[0m | }
         `----


    Caused by:
        Syntax Error

    [0m [90m 19 |[39m   [33mLocationMatcher[39m[33m,[39m
     [90m 20 |[39m   [33mPreferencesMatcher[39m[33m,[39m
    [31m[1m>[22m[39m[90m 21 |[39m   [33mSalaryMatcher[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 22 |[39m } [36mfrom[39m [32m'@/lib/scoring/algorithms'[39m[33m;[39m
     [90m 23 |[39m [36mimport[39m { [33mExplanationGenerator[39m } [36mfrom[39m [32m'@/lib/scoring/explanations'[39m[33m;[39m
     [90m 24 |[39m [36mimport[39m { logger } [36mfrom[39m [32m'@/lib/logging/logger'[39m[33m;[39m[0m

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)
      at Object.<anonymous> (src/services/matching/scoring-engine.ts:21:21)
      at Object.<anonymous> (tests/services/matching/scoring-engine.test.ts:24:24)

FAIL src/services/notifications/__tests__/email-channel.test.ts
  ● EmailChannelService › Single Email Sending › should send email successfully

    TypeError: emailService.send is not a function

    [0m [90m 81 |[39m       } [36mas[39m any)
     [90m 82 |[39m
    [31m[1m>[22m[39m[90m 83 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m emailService[33m.[39msend(payload)
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 84 |[39m
     [90m 85 |[39m       expect(result[33m.[39msuccess)[33m.[39mtoBe([36mtrue[39m)
     [90m 86 |[39m       expect(result[33m.[39mmessageId)[33m.[39mtoBe([32m'email-123'[39m)[0m

      at Object.send (src/services/notifications/__tests__/email-channel.test.ts:83:41)

  ● EmailChannelService › Single Email Sending › should handle suppressed recipients

    TypeError: emailService.send is not a function

    [0m [90m 112 |[39m       } [36mas[39m any)
     [90m 113 |[39m
    [31m[1m>[22m[39m[90m 114 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m emailService[33m.[39msend(payload)
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 115 |[39m
     [90m 116 |[39m       expect(result[33m.[39msuccess)[33m.[39mtoBe([36mfalse[39m)
     [90m 117 |[39m       expect(result[33m.[39merror)[33m.[39mtoContain([32m'suppressed'[39m)[0m

      at Object.send (src/services/notifications/__tests__/email-channel.test.ts:114:41)

  ● EmailChannelService › Single Email Sending › should handle template not found

    TypeError: emailService.send is not a function

    [0m [90m 134 |[39m       mockPrisma[33m.[39mnotificationTemplate[33m.[39mfindFirst[33m.[39mmockResolvedValue([36mnull[39m)
     [90m 135 |[39m
    [31m[1m>[22m[39m[90m 136 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m emailService[33m.[39msend(payload)
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 137 |[39m
     [90m 138 |[39m       expect(result[33m.[39msuccess)[33m.[39mtoBe([36mfalse[39m)
     [90m 139 |[39m       expect(result[33m.[39merror)[33m.[39mtoContain([32m'Template not found'[39m)[0m

      at Object.send (src/services/notifications/__tests__/email-channel.test.ts:136:41)

  ● EmailChannelService › Single Email Sending › should handle Resend API errors

    TypeError: emailService.send is not a function

    [0m [90m 167 |[39m       } [36mas[39m any)
     [90m 168 |[39m
    [31m[1m>[22m[39m[90m 169 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m emailService[33m.[39msend(payload)
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 170 |[39m
     [90m 171 |[39m       expect(result[33m.[39msuccess)[33m.[39mtoBe([36mfalse[39m)
     [90m 172 |[39m       expect(result[33m.[39merror)[33m.[39mtoContain([32m'Invalid email address'[39m)[0m

      at Object.send (src/services/notifications/__tests__/email-channel.test.ts:169:41)

  ● EmailChannelService › Bulk Email Sending › should send bulk emails successfully

    TypeError: emailService.sendBulk is not a function

    [0m [90m 208 |[39m         [33m.[39mmockResolvedValueOnce({ data[33m:[39m { id[33m:[39m [32m'email-2'[39m }[33m,[39m error[33m:[39m [36mnull[39m } [36mas[39m any)
     [90m 209 |[39m
    [31m[1m>[22m[39m[90m 210 |[39m       [36mconst[39m results [33m=[39m [36mawait[39m emailService[33m.[39msendBulk(payloads)
     [90m     |[39m                                          [31m[1m^[22m[39m
     [90m 211 |[39m
     [90m 212 |[39m       expect(results)[33m.[39mtoHaveLength([35m2[39m)
     [90m 213 |[39m       expect(results[33m.[39mevery(r [33m=>[39m r[33m.[39msuccess))[33m.[39mtoBe([36mtrue[39m)[0m

      at Object.sendBulk (src/services/notifications/__tests__/email-channel.test.ts:210:42)

  ● EmailChannelService › Bulk Email Sending › should handle partial failures in bulk sending

    TypeError: emailService.sendBulk is not a function

    [0m [90m 248 |[39m         [33m.[39mmockResolvedValueOnce({ data[33m:[39m [36mnull[39m[33m,[39m error[33m:[39m { message[33m:[39m [32m'Invalid email'[39m } } [36mas[39m any)
     [90m 249 |[39m
    [31m[1m>[22m[39m[90m 250 |[39m       [36mconst[39m results [33m=[39m [36mawait[39m emailService[33m.[39msendBulk(payloads)
     [90m     |[39m                                          [31m[1m^[22m[39m
     [90m 251 |[39m
     [90m 252 |[39m       expect(results)[33m.[39mtoHaveLength([35m2[39m)
     [90m 253 |[39m       expect(results[[35m0[39m][33m.[39msuccess)[33m.[39mtoBe([36mtrue[39m)[0m

      at Object.sendBulk (src/services/notifications/__tests__/email-channel.test.ts:250:42)

  ● EmailChannelService › Template Processing › should process template variables correctly

    TypeError: emailService.processTemplate is not a function

    [0m [90m 270 |[39m       }
     [90m 271 |[39m
    [31m[1m>[22m[39m[90m 272 |[39m       [36mconst[39m processed [33m=[39m emailService[[32m'processTemplate'[39m](template[33m,[39m variables)
     [90m     |[39m                                                        [31m[1m^[22m[39m
     [90m 273 |[39m
     [90m 274 |[39m       expect(processed[33m.[39msubject)[33m.[39mtoBe([32m'Welcome John to JobFinders!'[39m)
     [90m 275 |[39m       expect(processed[33m.[39mhtmlContent)[33m.[39mtoBe([32m'<h1>Hello John</h1><p>Welcome to our platform</p><p>Best regards, JobFinders</p>'[39m)[0m

      at Object.<anonymous> (src/services/notifications/__tests__/email-channel.test.ts:272:56)

  ● EmailChannelService › Template Processing › should handle missing template variables

    TypeError: emailService.processTemplate is not a function

    [0m [90m 289 |[39m       }
     [90m 290 |[39m
    [31m[1m>[22m[39m[90m 291 |[39m       [36mconst[39m processed [33m=[39m emailService[[32m'processTemplate'[39m](template[33m,[39m variables)
     [90m     |[39m                                                        [31m[1m^[22m[39m
     [90m 292 |[39m
     [90m 293 |[39m       expect(processed[33m.[39msubject)[33m.[39mtoBe([32m'Hello John!'[39m)
     [90m 294 |[39m       expect(processed[33m.[39mhtmlContent)[33m.[39mtoBe([32m'<p></p>'[39m)[0m

      at Object.<anonymous> (src/services/notifications/__tests__/email-channel.test.ts:291:56)

  ● EmailChannelService › Rate Limiting › should respect rate limits

    TypeError: emailService.send is not a function

    [0m [90m 313 |[39m       } [36mas[39m any
     [90m 314 |[39m
    [31m[1m>[22m[39m[90m 315 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m emailService[33m.[39msend(payload)
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 316 |[39m
     [90m 317 |[39m       expect(result[33m.[39msuccess)[33m.[39mtoBe([36mfalse[39m)
     [90m 318 |[39m       expect(result[33m.[39merror)[33m.[39mtoContain([32m'Rate limit exceeded'[39m)[0m

      at Object.send (src/services/notifications/__tests__/email-channel.test.ts:315:41)

  ● EmailChannelService › Webhook Handling › should handle delivery webhook

    TypeError: emailService.handleWebhook is not a function

    [0m [90m 333 |[39m       mockPrisma[33m.[39mnotificationDeliveryLog[33m.[39mupdate[33m.[39mmockResolvedValue({} [36mas[39m any)
     [90m 334 |[39m
    [31m[1m>[22m[39m[90m 335 |[39m       [36mawait[39m emailService[33m.[39mhandleWebhook(webhookData)
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 336 |[39m
     [90m 337 |[39m       expect(mockPrisma[33m.[39mnotificationDeliveryLog[33m.[39mupdate)[33m.[39mtoHaveBeenCalledWith({
     [90m 338 |[39m         where[33m:[39m { externalMessageId[33m:[39m [32m'email-123'[39m }[33m,[39m[0m

      at Object.handleWebhook (src/services/notifications/__tests__/email-channel.test.ts:335:26)

  ● EmailChannelService › Webhook Handling › should handle bounce webhook

    TypeError: emailService.handleWebhook is not a function

    [0m [90m 362 |[39m       mockPrisma[33m.[39mnotificationDeliveryLog[33m.[39mupdate[33m.[39mmockResolvedValue({} [36mas[39m any)
     [90m 363 |[39m
    [31m[1m>[22m[39m[90m 364 |[39m       [36mawait[39m emailService[33m.[39mhandleWebhook(webhookData)
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 365 |[39m
     [90m 366 |[39m       expect(mockPrisma[33m.[39mnotificationDeliveryLog[33m.[39mupdate)[33m.[39mtoHaveBeenCalledWith({
     [90m 367 |[39m         where[33m:[39m { externalMessageId[33m:[39m [32m'email-123'[39m }[33m,[39m[0m

      at Object.handleWebhook (src/services/notifications/__tests__/email-channel.test.ts:364:26)

  ● EmailChannelService › Webhook Handling › should handle open webhook

    TypeError: emailService.handleWebhook is not a function

    [0m [90m 389 |[39m       }
     [90m 390 |[39m
    [31m[1m>[22m[39m[90m 391 |[39m       [36mawait[39m emailService[33m.[39mhandleWebhook(webhookData)
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 392 |[39m
     [90m 393 |[39m       expect(mockAnalytics[33m.[39mtrackEvent)[33m.[39mtoHaveBeenCalledWith([32m'email_opened'[39m[33m,[39m {
     [90m 394 |[39m         messageId[33m:[39m [32m'email-123'[39m[33m,[39m[0m

      at Object.handleWebhook (src/services/notifications/__tests__/email-channel.test.ts:391:26)

  ● EmailChannelService › Webhook Handling › should handle click webhook

    TypeError: emailService.handleWebhook is not a function

    [0m [90m 409 |[39m       }
     [90m 410 |[39m
    [31m[1m>[22m[39m[90m 411 |[39m       [36mawait[39m emailService[33m.[39mhandleWebhook(webhookData)
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 412 |[39m
     [90m 413 |[39m       expect(mockAnalytics[33m.[39mtrackEvent)[33m.[39mtoHaveBeenCalledWith([32m'email_clicked'[39m[33m,[39m {
     [90m 414 |[39m         messageId[33m:[39m [32m'email-123'[39m[33m,[39m[0m

      at Object.handleWebhook (src/services/notifications/__tests__/email-channel.test.ts:411:26)

FAIL tests/integration/recommendation-system.test.ts
  ● Test suite failed to run

    Cannot find module '../../lib/ml/matrix-factorization' from 'src/services/matching/collaborative-filter.ts'

    Require stack:
      src/services/matching/collaborative-filter.ts
      src/services/matching/recommendation-engine.ts
      tests/integration/recommendation-system.test.ts

    [0m [90m 17 |[39m
     [90m 18 |[39m [90m/**[39m
    [31m[1m>[22m[39m[90m 19 |[39m [90m * User interaction data[39m
     [90m    |[39m                              [31m[1m^[22m[39m
     [90m 20 |[39m [90m */[39m
     [90m 21 |[39m [36minterface[39m [33mUserItemInteraction[39m {
     [90m 22 |[39m   userId[33m:[39m string[33m;[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.<anonymous> (src/services/matching/collaborative-filter.ts:19:30)
      at Object.<anonymous> (src/services/matching/recommendation-engine.ts:19:30)
      at Object.<anonymous> (tests/integration/recommendation-system.test.ts:35:31)

FAIL __tests__/services/matching/profile-analyzer.test.ts
  ● Test suite failed to run

      [31mx[0m Expected '{', got 'interface'
         ,-[[36;1;4mE:\projects\jobfinders_mvp\src\types\profiles.ts[0m:671:1]
     [2m668[0m |   GEOGRAPHIC = 'geographic'
     [2m669[0m | }
     [2m670[0m | 
     [2m671[0m | export interface CompensationPhilosophy {
         : [35;1m       ^^^^^^^^^[0m
     [2m672[0m |   type: CompensationType;
     [2m673[0m |   range: SalaryRange;
     [2m674[0m |   bonuses: BonusStructure[];
         `----


    Caused by:
        Syntax Error

    [0m [90m  5 |[39m   [33mJobProfile[39m[33m,[39m
     [90m  6 |[39m   [33mWorkExperience[39m[33m,[39m
    [31m[1m>[22m[39m[90m  7 |[39m   [33mEducation[39m[33m,[39m
     [90m    |[39m                   [31m[1m^[22m[39m
     [90m  8 |[39m   [33mJobRequirements[39m
     [90m  9 |[39m } [36mfrom[39m [32m'@/types/profiles'[39m[33m;[39m
     [90m 10 |[39m [36mimport[39m { [33mExperienceLevel[39m[33m,[39m [33mSkillLevel[39m[33m,[39m [33mEducationLevel[39m } [36mfrom[39m [32m'@/types/profiles'[39m[33m;[39m[0m

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)
      at Object.<anonymous> (__tests__/services/matching/profile-analyzer.test.ts:7:19)

FAIL tests/integration/matching-workflow.test.ts
  ● Test suite failed to run

      [31mx[0m Expected ';', got ')'
         ,-[[36;1;4mE:\projects\jobfinders_mvp\src\lib\scoring\algorithms.ts[0m:849:1]
     [2m846[0m |     } else {
     [2m847[0m |       // Candidate salary is above job range
     [2m848[0m |       const excess = (candidateMin - jobMax) / candidateMin;
     [2m849[0m |       return Math.max(0, 1 - excess * 0.5));
         : [35;1m                                          ^[0m
     [2m850[0m |     }
     [2m851[0m |   }
     [2m852[0m | }
         `----


    Caused by:
        Syntax Error

    [0m [90m 19 |[39m   [33mLocationMatcher[39m[33m,[39m
     [90m 20 |[39m   [33mPreferencesMatcher[39m[33m,[39m
    [31m[1m>[22m[39m[90m 21 |[39m   [33mSalaryMatcher[39m
     [90m    |[39m                     [31m[1m^[22m[39m
     [90m 22 |[39m } [36mfrom[39m [32m'@/lib/scoring/algorithms'[39m[33m;[39m
     [90m 23 |[39m [36mimport[39m { [33mExplanationGenerator[39m } [36mfrom[39m [32m'@/lib/scoring/explanations'[39m[33m;[39m
     [90m 24 |[39m [36mimport[39m { logger } [36mfrom[39m [32m'@/lib/logging/logger'[39m[33m;[39m[0m

      at Object.transformSync (node_modules/next/src/build/swc/index.ts:1232:25)
      at transformSync (node_modules/next/src/build/swc/index.ts:1322:19)
      at Object.process (node_modules/next/src/build/swc/jest-transformer.ts:105:25)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/index.js:422:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/index.js:519:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/index.js:558:19)
      at Object.<anonymous> (src/services/matching/scoring-engine.ts:21:21)
      at Object.<anonymous> (tests/integration/matching-workflow.test.ts:28:24)

FAIL __tests__/subscription.test.ts
  ● Test suite failed to run

    Cannot find module 'pdf-lib' from 'src/services/invoice.ts'

    Require stack:
      src/services/invoice.ts
      __tests__/subscription.test.ts

    [0m [90m 10 |[39m   status[33m:[39m [32m'PAID'[39m [33m|[39m [32m'PENDING'[39m [33m|[39m [32m'FAILED'[39m[33m;[39m
     [90m 11 |[39m   billingPeriod[33m:[39m {
    [31m[1m>[22m[39m[90m 12 |[39m     start[33m:[39m [33mDate[39m[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 13 |[39m     end[33m:[39m [33mDate[39m[33m;[39m
     [90m 14 |[39m   }[33m;[39m
     [90m 15 |[39m   items[33m:[39m [33mArray[39m[33m<[39m{[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.<anonymous> (src/services/invoice.ts:12:17)
      at Object.<anonymous> (__tests__/subscription.test.ts:9:18)

FAIL tests/services/matching/profile-analyzer.test.ts
  ● ProfileAnalyzer › analyzeProfile › should analyze profile and return results

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 124 |[39m   describe([32m'analyzeProfile'[39m[33m,[39m () [33m=>[39m {
     [90m 125 |[39m     it([32m'should analyze profile and return results'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 126 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 127 |[39m
     [90m 128 |[39m       expect(result)[33m.[39mtoBeDefined()[33m;[39m
     [90m 129 |[39m       expect(result[33m.[39mcompleteness)[33m.[39mtoBeGreaterThanOrEqual([35m0[39m)[33m;[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:126:44)

  ● ProfileAnalyzer › analyzeProfile › should calculate completeness score correctly

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 136 |[39m
     [90m 137 |[39m     it([32m'should calculate completeness score correctly'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 138 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 139 |[39m
     [90m 140 |[39m       expect(result[33m.[39mcompleteness)[33m.[39mtoBeGreaterThan([35m80[39m)[33m;[39m
     [90m 141 |[39m       expect(result[33m.[39mcompleteness)[33m.[39mtoBeLessThanOrEqual([35m100[39m)[33m;[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:138:44)

  ● ProfileAnalyzer › analyzeProfile › should identify strengths

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 143 |[39m
     [90m 144 |[39m     it([32m'should identify strengths'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 145 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 146 |[39m
     [90m 147 |[39m       expect(result[33m.[39mstrengths[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m
     [90m 148 |[39m       expect(result[33m.[39mstrengths)[33m.[39mtoContainEqual([0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:145:44)

  ● ProfileAnalyzer › analyzeProfile › should identify weaknesses

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 163 |[39m       }[33m;[39m
     [90m 164 |[39m
    [31m[1m>[22m[39m[90m 165 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(incompleteProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 166 |[39m
     [90m 167 |[39m       expect(result[33m.[39mweaknesses[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m
     [90m 168 |[39m       expect(result[33m.[39mweaknesses)[33m.[39mtoContainEqual([0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:165:44)

  ● ProfileAnalyzer › analyzeProfile › should provide recommendations

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 176 |[39m
     [90m 177 |[39m     it([32m'should provide recommendations'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 178 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 179 |[39m
     [90m 180 |[39m       expect(result[33m.[39mrecommendations[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m
     [90m 181 |[39m       expect(result[33m.[39mrecommendations)[33m.[39mtoContainEqual([0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:178:44)

  ● ProfileAnalyzer › analyzeProfile › should handle empty profile

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 211 |[39m       }[33m;[39m
     [90m 212 |[39m
    [31m[1m>[22m[39m[90m 213 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(emptyProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 214 |[39m
     [90m 215 |[39m       expect(result[33m.[39mcompleteness)[33m.[39mtoBeLessThan([35m20[39m)[33m;[39m
     [90m 216 |[39m       expect(result[33m.[39mweaknesses[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m5[39m)[33m;[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:213:44)

  ● ProfileAnalyzer › calculateCompleteness › should give high score for complete profile

    TypeError: profileAnalyzer.calculateCompleteness is not a function

    [0m [90m 220 |[39m   describe([32m'calculateCompleteness'[39m[33m,[39m () [33m=>[39m {
     [90m 221 |[39m     it([32m'should give high score for complete profile'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 222 |[39m       [36mconst[39m score [33m=[39m profileAnalyzer[33m.[39mcalculateCompleteness(mockProfile)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 223 |[39m
     [90m 224 |[39m       expect(score)[33m.[39mtoBeGreaterThan([35m80[39m)[33m;[39m
     [90m 225 |[39m       expect(score)[33m.[39mtoBeLessThanOrEqual([35m100[39m)[33m;[39m[0m

      at Object.calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:222:37)

  ● ProfileAnalyzer › calculateCompleteness › should give low score for incomplete profile

    TypeError: profileAnalyzer.calculateCompleteness is not a function

    [0m [90m 235 |[39m       }[33m;[39m
     [90m 236 |[39m
    [31m[1m>[22m[39m[90m 237 |[39m       [36mconst[39m score [33m=[39m profileAnalyzer[33m.[39mcalculateCompleteness(incompleteProfile)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 238 |[39m
     [90m 239 |[39m       expect(score)[33m.[39mtoBeLessThan([35m50[39m)[33m;[39m
     [90m 240 |[39m     })[33m;[39m[0m

      at Object.calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:237:37)

  ● ProfileAnalyzer › calculateCompleteness › should calculate personal info completeness

    TypeError: profileAnalyzer.calculateCompleteness is not a function

    [0m [90m 246 |[39m       }[33m;[39m
     [90m 247 |[39m
    [31m[1m>[22m[39m[90m 248 |[39m       [36mconst[39m score [33m=[39m profileAnalyzer[33m.[39mcalculateCompleteness(profileWithoutPersonalInfo)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 249 |[39m
     [90m 250 |[39m       expect(score)[33m.[39mtoBeLessThan(mockProfile[33m.[39mcompleteness)[33m;[39m
     [90m 251 |[39m     })[33m;[39m[0m

      at Object.calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:248:37)

  ● ProfileAnalyzer › calculateCompleteness › should calculate experience completeness

    TypeError: profileAnalyzer.calculateCompleteness is not a function

    [0m [90m 257 |[39m       }[33m;[39m
     [90m 258 |[39m
    [31m[1m>[22m[39m[90m 259 |[39m       [36mconst[39m score [33m=[39m profileAnalyzer[33m.[39mcalculateCompleteness(profileWithoutExperience)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 260 |[39m
     [90m 261 |[39m       expect(score)[33m.[39mtoBeLessThan(mockProfile[33m.[39mcompleteness)[33m;[39m
     [90m 262 |[39m     })[33m;[39m[0m

      at Object.calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:259:37)

  ● ProfileAnalyzer › calculateCompleteness › should calculate skills completeness

    TypeError: profileAnalyzer.calculateCompleteness is not a function

    [0m [90m 268 |[39m       }[33m;[39m
     [90m 269 |[39m
    [31m[1m>[22m[39m[90m 270 |[39m       [36mconst[39m score [33m=[39m profileAnalyzer[33m.[39mcalculateCompleteness(profileWithoutSkills)[33m;[39m
     [90m     |[39m                                     [31m[1m^[22m[39m
     [90m 271 |[39m
     [90m 272 |[39m       expect(score)[33m.[39mtoBeLessThan(mockProfile[33m.[39mcompleteness)[33m;[39m
     [90m 273 |[39m     })[33m;[39m[0m

      at Object.calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:270:37)

  ● ProfileAnalyzer › extractSkills › should extract skills from experience descriptions

    expect(received).toBeGreaterThan(expected)

    Expected: > 0
    Received:   0

    [0m [90m 286 |[39m
     [90m 287 |[39m       expect(result)[33m.[39mtoBeDefined()[33m;[39m
    [31m[1m>[22m[39m[90m 288 |[39m       expect(result[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 289 |[39m       expect(result)[33m.[39mtoContainEqual(
     [90m 290 |[39m         expect[33m.[39mobjectContaining({
     [90m 291 |[39m           name[33m:[39m expect[33m.[39many([33mString[39m)[33m,[39m[0m

      at Object.toBeGreaterThan (tests/services/matching/profile-analyzer.test.ts:288:29)

  ● ProfileAnalyzer › extractSkills › should extract skills from projects

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

    [0m [90m 306 |[39m
     [90m 307 |[39m       expect(result)[33m.[39mtoBeDefined()[33m;[39m
    [31m[1m>[22m[39m[90m 308 |[39m       expect(result[33m.[39msome(skill [33m=>[39m skill[33m.[39msource [33m===[39m [32m'projects'[39m))[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m     |[39m                                                                 [31m[1m^[22m[39m
     [90m 309 |[39m     })[33m;[39m
     [90m 310 |[39m
     [90m 311 |[39m     it([32m'should deduplicate extracted skills'[39m[33m,[39m [36masync[39m () [33m=>[39m {[0m

      at Object.toBe (tests/services/matching/profile-analyzer.test.ts:308:65)

  ● ProfileAnalyzer › extractSkills › should deduplicate extracted skills

    expect(received).toBe(expected) // Object.is equality

    Expected: 1
    Received: 0

    [0m [90m 320 |[39m
     [90m 321 |[39m       [36mconst[39m reactSkills [33m=[39m result[33m.[39mfilter(skill [33m=>[39m skill[33m.[39mname [33m===[39m [32m'React'[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 322 |[39m       expect(reactSkills[33m.[39mlength)[33m.[39mtoBe([35m1[39m)[33m;[39m
     [90m     |[39m                                  [31m[1m^[22m[39m
     [90m 323 |[39m     })[33m;[39m
     [90m 324 |[39m   })[33m;[39m
     [90m 325 |[39m[0m

      at Object.toBe (tests/services/matching/profile-analyzer.test.ts:322:34)

  ● ProfileAnalyzer › validateExperience › should validate experience entries

    TypeError: profileAnalyzer.validateExperience is not a function

    [0m [90m 328 |[39m       [36mconst[39m validExperience [33m=[39m mockProfile[33m.[39mexperience[[35m0[39m][33m;[39m
     [90m 329 |[39m
    [31m[1m>[22m[39m[90m 330 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mvalidateExperience(validExperience)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 331 |[39m
     [90m 332 |[39m       expect(result[33m.[39misValid)[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m 333 |[39m       expect(result[33m.[39merrors)[33m.[39mtoHaveLength([35m0[39m)[33m;[39m[0m

      at Object.validateExperience (tests/services/matching/profile-analyzer.test.ts:330:38)

  ● ProfileAnalyzer › validateExperience › should identify invalid experience entries

    TypeError: profileAnalyzer.validateExperience is not a function

    [0m [90m 347 |[39m       }[33m;[39m
     [90m 348 |[39m
    [31m[1m>[22m[39m[90m 349 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mvalidateExperience(invalidExperience)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 350 |[39m
     [90m 351 |[39m       expect(result[33m.[39misValid)[33m.[39mtoBe([36mfalse[39m)[33m;[39m
     [90m 352 |[39m       expect(result[33m.[39merrors[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m[0m

      at Object.validateExperience (tests/services/matching/profile-analyzer.test.ts:349:38)

  ● ProfileAnalyzer › validateExperience › should handle missing required fields

    TypeError: profileAnalyzer.validateExperience is not a function

    [0m [90m 365 |[39m       }[33m;[39m
     [90m 366 |[39m
    [31m[1m>[22m[39m[90m 367 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mvalidateExperience(incompleteExperience)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 368 |[39m
     [90m 369 |[39m       expect(result[33m.[39misValid)[33m.[39mtoBe([36mfalse[39m)[33m;[39m
     [90m 370 |[39m       expect(result[33m.[39merrors[33m.[39msome(error [33m=>[39m error[33m.[39mincludes([32m'company'[39m)))[33m.[39mtoBe([36mtrue[39m)[33m;[39m[0m

      at Object.validateExperience (tests/services/matching/profile-analyzer.test.ts:367:38)

  ● ProfileAnalyzer › validateExperience › should validate date consistency

    TypeError: profileAnalyzer.validateExperience is not a function

    [0m [90m 379 |[39m       }[33m;[39m
     [90m 380 |[39m
    [31m[1m>[22m[39m[90m 381 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mvalidateExperience(experienceWithBadDates)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 382 |[39m
     [90m 383 |[39m       expect(result[33m.[39misValid)[33m.[39mtoBe([36mfalse[39m)[33m;[39m
     [90m 384 |[39m       expect(result[33m.[39merrors[33m.[39msome(error [33m=>[39m error[33m.[39mincludes([32m'date'[39m)))[33m.[39mtoBe([36mtrue[39m)[33m;[39m[0m

      at Object.validateExperience (tests/services/matching/profile-analyzer.test.ts:381:38)

  ● ProfileAnalyzer › analyzeSkills › should analyze skill distribution

    TypeError: profileAnalyzer.analyzeSkills is not a function

    [0m [90m 388 |[39m   describe([32m'analyzeSkills'[39m[33m,[39m () [33m=>[39m {
     [90m 389 |[39m     it([32m'should analyze skill distribution'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 390 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeSkills(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 391 |[39m
     [90m 392 |[39m       expect(result)[33m.[39mtoBeDefined()[33m;[39m
     [90m 393 |[39m       expect(result[33m.[39mtotalSkills)[33m.[39mtoBe(mockProfile[33m.[39mskills[33m.[39mlength)[33m;[39m[0m

      at Object.analyzeSkills (tests/services/matching/profile-analyzer.test.ts:390:44)

  ● ProfileAnalyzer › analyzeSkills › should categorize skills correctly

    TypeError: profileAnalyzer.analyzeSkills is not a function

    [0m [90m 398 |[39m
     [90m 399 |[39m     it([32m'should categorize skills correctly'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 400 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeSkills(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 401 |[39m
     [90m 402 |[39m       expect(result[33m.[39mcategories)[33m.[39mtoHaveProperty([32m'technical'[39m)[33m;[39m
     [90m 403 |[39m       expect(result[33m.[39mcategories)[33m.[39mtoHaveProperty([32m'soft'[39m)[33m;[39m[0m

      at Object.analyzeSkills (tests/services/matching/profile-analyzer.test.ts:400:44)

  ● ProfileAnalyzer › analyzeSkills › should calculate level distribution

    TypeError: profileAnalyzer.analyzeSkills is not a function

    [0m [90m 406 |[39m
     [90m 407 |[39m     it([32m'should calculate level distribution'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 408 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeSkills(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 409 |[39m
     [90m 410 |[39m       expect(result[33m.[39mlevelDistribution)[33m.[39mtoHaveProperty([32m'EXPERT'[39m)[33m;[39m
     [90m 411 |[39m       expect(result[33m.[39mlevelDistribution)[33m.[39mtoHaveProperty([32m'ADVANCED'[39m)[33m;[39m[0m

      at Object.analyzeSkills (tests/services/matching/profile-analyzer.test.ts:408:44)

  ● ProfileAnalyzer › analyzeSkills › should identify top skills

    TypeError: profileAnalyzer.analyzeSkills is not a function

    [0m [90m 415 |[39m
     [90m 416 |[39m     it([32m'should identify top skills'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 417 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeSkills(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 418 |[39m
     [90m 419 |[39m       expect(result[33m.[39mtopSkills)[33m.[39mtoBeDefined()[33m;[39m
     [90m 420 |[39m       expect(result[33m.[39mtopSkills[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m[0m

      at Object.analyzeSkills (tests/services/matching/profile-analyzer.test.ts:417:44)

  ● ProfileAnalyzer › analyzeSkills › should suggest missing skills

    TypeError: profileAnalyzer.analyzeSkills is not a function

    [0m [90m 425 |[39m
     [90m 426 |[39m     it([32m'should suggest missing skills'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 427 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeSkills(mockProfile)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 428 |[39m
     [90m 429 |[39m       expect(result[33m.[39msuggestedSkills)[33m.[39mtoBeDefined()[33m;[39m
     [90m 430 |[39m       expect([33mArray[39m[33m.[39misArray(result[33m.[39msuggestedSkills))[33m.[39mtoBe([36mtrue[39m)[33m;[39m[0m

      at Object.analyzeSkills (tests/services/matching/profile-analyzer.test.ts:427:44)

  ● ProfileAnalyzer › generateRecommendations › should generate profile improvement recommendations

    TypeError: profileAnalyzer.generateRecommendations is not a function

    [0m [90m 434 |[39m   describe([32m'generateRecommendations'[39m[33m,[39m () [33m=>[39m {
     [90m 435 |[39m     it([32m'should generate profile improvement recommendations'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 436 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mgenerateRecommendations(mockProfile)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 437 |[39m
     [90m 438 |[39m       expect(result)[33m.[39mtoBeDefined()[33m;[39m
     [90m 439 |[39m       expect(result[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m[0m

      at Object.generateRecommendations (tests/services/matching/profile-analyzer.test.ts:436:38)

  ● ProfileAnalyzer › generateRecommendations › should prioritize recommendations correctly

    TypeError: profileAnalyzer.generateRecommendations is not a function

    [0m [90m 449 |[39m       }[33m;[39m
     [90m 450 |[39m
    [31m[1m>[22m[39m[90m 451 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mgenerateRecommendations(incompleteProfile)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 452 |[39m
     [90m 453 |[39m       expect(result)[33m.[39mtoContainEqual(
     [90m 454 |[39m         expect[33m.[39mobjectContaining({[0m

      at Object.generateRecommendations (tests/services/matching/profile-analyzer.test.ts:451:38)

  ● ProfileAnalyzer › generateRecommendations › should categorize recommendations

    TypeError: profileAnalyzer.generateRecommendations is not a function

    [0m [90m 459 |[39m
     [90m 460 |[39m     it([32m'should categorize recommendations'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 461 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mgenerateRecommendations(mockProfile)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 462 |[39m
     [90m 463 |[39m       expect(result[33m.[39msome(rec [33m=>[39m rec[33m.[39mcategory [33m===[39m [32m'experience'[39m))[33m.[39mtoBe([36mtrue[39m)[33m;[39m
     [90m 464 |[39m       expect(result[33m.[39msome(rec [33m=>[39m rec[33m.[39mcategory [33m===[39m [32m'skills'[39m))[33m.[39mtoBe([36mtrue[39m)[33m;[39m[0m

      at Object.generateRecommendations (tests/services/matching/profile-analyzer.test.ts:461:38)

  ● ProfileAnalyzer › generateRecommendations › should provide actionable recommendations

    TypeError: profileAnalyzer.generateRecommendations is not a function

    [0m [90m 467 |[39m
     [90m 468 |[39m     it([32m'should provide actionable recommendations'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 469 |[39m       [36mconst[39m result [33m=[39m profileAnalyzer[33m.[39mgenerateRecommendations(mockProfile)[33m;[39m
     [90m     |[39m                                      [31m[1m^[22m[39m
     [90m 470 |[39m
     [90m 471 |[39m       result[33m.[39mforEach(recommendation [33m=>[39m {
     [90m 472 |[39m         expect(recommendation[33m.[39maction)[33m.[39mtoBeDefined()[33m;[39m[0m

      at Object.generateRecommendations (tests/services/matching/profile-analyzer.test.ts:469:38)

  ● ProfileAnalyzer › error handling › should handle null profile

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 480 |[39m   describe([32m'error handling'[39m[33m,[39m () [33m=>[39m {
     [90m 481 |[39m     it([32m'should handle null profile'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 482 |[39m       [36mawait[39m expect(profileAnalyzer[33m.[39manalyzeProfile([36mnull[39m [36mas[39m any))
     [90m     |[39m                                    [31m[1m^[22m[39m
     [90m 483 |[39m         [33m.[39mrejects[33m.[39mtoThrow()[33m;[39m
     [90m 484 |[39m     })[33m;[39m
     [90m 485 |[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:482:36)

  ● ProfileAnalyzer › error handling › should handle undefined profile

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 485 |[39m
     [90m 486 |[39m     it([32m'should handle undefined profile'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 487 |[39m       [36mawait[39m expect(profileAnalyzer[33m.[39manalyzeProfile(undefined [36mas[39m any))
     [90m     |[39m                                    [31m[1m^[22m[39m
     [90m 488 |[39m         [33m.[39mrejects[33m.[39mtoThrow()[33m;[39m
     [90m 489 |[39m     })[33m;[39m
     [90m 490 |[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:487:36)

  ● ProfileAnalyzer › error handling › should handle invalid profile structure

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 492 |[39m       [36mconst[39m invalidProfile [33m=[39m { invalid[33m:[39m [32m'structure'[39m }[33m;[39m
     [90m 493 |[39m
    [31m[1m>[22m[39m[90m 494 |[39m       [36mconst[39m result [33m=[39m [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(invalidProfile [36mas[39m any)[33m;[39m
     [90m     |[39m                                            [31m[1m^[22m[39m
     [90m 495 |[39m
     [90m 496 |[39m       expect(result[33m.[39mcompleteness)[33m.[39mtoBe([35m0[39m)[33m;[39m
     [90m 497 |[39m       expect(result[33m.[39mweaknesses[33m.[39mlength)[33m.[39mtoBeGreaterThan([35m0[39m)[33m;[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:494:44)

  ● ProfileAnalyzer › error handling › should handle missing experience array

    expect(received).not.toThrow()

    Error name:    "TypeError"
    Error message: "profileAnalyzer.calculateCompleteness is not a function"

        [0m [90m 504 |[39m       }[33m;[39m
         [90m 505 |[39m
        [31m[1m>[22m[39m[90m 506 |[39m       expect(() [33m=>[39m profileAnalyzer[33m.[39mcalculateCompleteness(profileWithoutExperienceArray))
         [90m     |[39m                                    [31m[1m^[22m[39m
         [90m 507 |[39m         [33m.[39mnot[33m.[39mtoThrow()[33m;[39m
         [90m 508 |[39m     })[33m;[39m
         [90m 509 |[39m   })[33m;[39m[0m

      at calculateCompleteness (tests/services/matching/profile-analyzer.test.ts:506:36)
      at Object.<anonymous> (node_modules/expect/build/index.js:1824:9)
      at Object.throwingMatcher [as toThrow] (node_modules/expect/build/index.js:2235:93)
      at Object.toThrow (tests/services/matching/profile-analyzer.test.ts:507:14)
      at Object.toThrow (tests/services/matching/profile-analyzer.test.ts:507:14)

  ● ProfileAnalyzer › performance › should analyze profile within performance threshold

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 513 |[39m       [36mconst[39m startTime [33m=[39m [33mDate[39m[33m.[39mnow()[33m;[39m
     [90m 514 |[39m
    [31m[1m>[22m[39m[90m 515 |[39m       [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(mockProfile)[33m;[39m
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 516 |[39m
     [90m 517 |[39m       [36mconst[39m duration [33m=[39m [33mDate[39m[33m.[39mnow() [33m-[39m startTime[33m;[39m
     [90m 518 |[39m       expect(duration)[33m.[39mtoBeLessThan([35m1000[39m)[33m;[39m [90m// Should complete within 1 second[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:515:29)

  ● ProfileAnalyzer › performance › should handle large profile efficiently

    TypeError: profileAnalyzer.analyzeProfile is not a function

    [0m [90m 537 |[39m       [36mconst[39m startTime [33m=[39m [33mDate[39m[33m.[39mnow()[33m;[39m
     [90m 538 |[39m
    [31m[1m>[22m[39m[90m 539 |[39m       [36mawait[39m profileAnalyzer[33m.[39manalyzeProfile(largeProfile)[33m;[39m
     [90m     |[39m                             [31m[1m^[22m[39m
     [90m 540 |[39m
     [90m 541 |[39m       [36mconst[39m duration [33m=[39m [33mDate[39m[33m.[39mnow() [33m-[39m startTime[33m;[39m
     [90m 542 |[39m       expect(duration)[33m.[39mtoBeLessThan([35m2000[39m)[33m;[39m [90m// Should complete within 2 seconds[39m[0m

      at Object.analyzeProfile (tests/services/matching/profile-analyzer.test.ts:539:29)


Test Suites: 27 failed, 1 passed, 28 total
Tests:       136 failed, 57 passed, 193 total
Snapshots:   0 total
Time:        14.55 s
Ran all test suites.
 (medium severity)

YOUR TASKS:
1. Analyze the issues and identify root causes
2. Fix all issues systematically
3. Ensure your fixes don't break existing functionality
4. Run tests to verify fixes
5. Create a brief summary of changes made

BOUNDARIES:
- You can modify any source files in src/
- You can create tests in tests/ or __tests__/
- You can modify configuration files if needed
- DO NOT modify .kiro/specs/ or .kiro/prompts/

WORK AUTONOMOUSLY:
- Analyze issues on your own
- Make decisions independently
- Implement fixes without asking for permission
- Test your changes
- Report completion when done

Start with "AUTONOMOUS FIX STARTED" and end with "TASK COMPLETED"