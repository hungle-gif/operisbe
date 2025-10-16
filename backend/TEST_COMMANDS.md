# Test Commands Documentation

## Running E2E Tests

### All Tests
```bash
# Run all tests in the project
docker-compose exec backend python manage.py test

# Run with verbose output
docker-compose exec backend python manage.py test --verbosity=2

# Run with coverage
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
```

### Module-Specific Tests

#### Users Module
```bash
# Run all user tests
docker-compose exec backend python manage.py test apps.users.tests

# Run only E2E tests
docker-compose exec backend python manage.py test apps.users.tests.test_e2e_users

# Run specific test case
docker-compose exec backend python manage.py test apps.users.tests.test_e2e_users.UserE2ETestCase.test_user_registration_and_login_flow
```

#### Projects Module
```bash
# Run all project tests
docker-compose exec backend python manage.py test apps.projects.tests

# Run only E2E tests
docker-compose exec backend python manage.py test apps.projects.tests.test_e2e_projects

# Run specific test case
docker-compose exec backend python manage.py test apps.projects.tests.test_e2e_projects.ProjectE2ETestCase.test_complete_project_lifecycle
```

#### Customers Module
```bash
# Run all customer tests
docker-compose exec backend python manage.py test apps.customers.tests

# Run only E2E tests
docker-compose exec backend python manage.py test apps.customers.tests.test_e2e_customers
```

#### Services Module
```bash
# Run all service tests
docker-compose exec backend python manage.py test apps.services.tests

# Run only E2E tests
docker-compose exec backend python manage.py test apps.services.tests.test_e2e_services
```

#### Sales Module
```bash
# Run all sales tests
docker-compose exec backend python manage.py test apps.sales.tests

# Run only E2E tests
docker-compose exec backend python manage.py test apps.sales.tests.test_e2e_sales
```

#### Tasks Module
```bash
# Run all task tests
docker-compose exec backend python manage.py test apps.tasks.tests

# Run only E2E tests
docker-compose exec backend python manage.py test apps.tasks.tests.test_e2e_tasks
```

---

## Test Output Format

### Standard Output (No Colors)
Tests are configured to output clean text without ANSI color codes:

```
============================================================
RUNNING E2E TESTS - USERS MODULE
============================================================

[TEST] User Registration and Login Flow
  [STEP 1] Registering new user...
    Result: 201 - User registered
  [STEP 2] Logging in with new credentials...
    Result: 200 - Login successful, token received
  [STEP 3] Fetching user profile...
    Result: 200 - Profile fetched: newuser@test.com
  [PASSED] Complete flow successful

[TEST] User Profile Update Flow
  [STEP 1] Logging in...
    Result: 200 - Logged in
  [STEP 2] Updating profile...
    Result: 200 - Profile updated
  [STEP 3] Verifying changes...
    Result: Changes verified - Name: Updated Customer Name
  [PASSED] Profile update successful

============================================================
E2E TESTS COMPLETED
============================================================

Ran 4 tests in 2.543s
OK
```

---

## Test Configuration

### Settings for Tests
Tests use a separate test database:
```python
# config/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'operis_test' if 'test' in sys.argv else 'operis',
        ...
    }
}
```

### Disable Logging During Tests
```python
# config/settings.py
if 'test' in sys.argv:
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': True,
    }
```

---

## Running Tests in CI/CD

### GitHub Actions Example
```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Build containers
        run: docker-compose up -d --build

      - name: Wait for services
        run: sleep 10

      - name: Run migrations
        run: docker-compose exec -T backend python manage.py migrate

      - name: Run all tests
        run: docker-compose exec -T backend python manage.py test --verbosity=2

      - name: Generate coverage report
        run: |
          docker-compose exec -T backend coverage run --source='.' manage.py test
          docker-compose exec -T backend coverage report
```

---

## Test Database Management

### Create Test Database
```bash
docker-compose exec backend python manage.py migrate --database=default
```

### Reset Test Database
```bash
docker-compose exec backend python manage.py flush --no-input
docker-compose exec backend python manage.py migrate
```

### Load Test Fixtures
```bash
docker-compose exec backend python manage.py loaddata test_fixtures.json
```

---

## Common Test Patterns

### Test with Authentication
```python
# Get auth token
response = self.client.post(
    '/api/auth/login',
    data=json.dumps({'email': 'user@test.com', 'password': 'pass123'}),
    content_type='application/json'
)
token = response.json()['access_token']

# Use token in requests
response = self.client.get(
    '/api/endpoint',
    HTTP_AUTHORIZATION=f'Bearer {token}'
)
```

### Test API Responses
```python
# Check status code
self.assertEqual(response.status_code, 200)

# Check response data
data = response.json()
self.assertEqual(data['field'], 'expected_value')
self.assertIn('field_name', data)
```

### Test Database Changes
```python
# Check object created
self.assertTrue(Model.objects.filter(id=obj_id).exists())

# Check field values
obj = Model.objects.get(id=obj_id)
self.assertEqual(obj.field, 'expected_value')
```

---

## Debugging Tests

### Run Single Test with Debug
```bash
docker-compose exec backend python manage.py test apps.module.tests.test_file.TestClass.test_method --pdb
```

### Print Debug Info
```python
# In test code
import pdb; pdb.set_trace()  # Breakpoint
print(f"DEBUG: {variable}")
```

### Check Test Database
```bash
docker-compose exec backend python manage.py dbshell
\dt  # List tables
SELECT * FROM tablename;
```

---

## Performance Testing

### Measure Test Time
```bash
docker-compose exec backend python manage.py test --timing
```

### Profile Tests
```bash
docker-compose exec backend python -m cProfile manage.py test
```

---

## Test Coverage

### Generate Coverage Report
```bash
# Install coverage
docker-compose exec backend pip install coverage

# Run tests with coverage
docker-compose exec backend coverage run --source='apps' manage.py test

# View report
docker-compose exec backend coverage report

# Generate HTML report
docker-compose exec backend coverage html
# Open htmlcov/index.html in browser
```

### Coverage by Module
```bash
docker-compose exec backend coverage report --include='apps/users/*'
docker-compose exec backend coverage report --include='apps/projects/*'
```

---

## Expected Test Results

### All Tests Should Pass
```
Ran 24 tests in 15.234s
OK
```

### Test Summary
- Users Module: 4 tests
- Projects Module: 2 tests
- Customers Module: 2 tests
- Services Module: 2 tests
- Sales Module: 3 tests
- Tasks Module: 2 tests

**Total: ~15-20 E2E tests covering main workflows**

---

## Troubleshooting

### Tests Fail with Database Error
```bash
# Reset database
docker-compose down
docker-compose up -d
docker-compose exec backend python manage.py migrate
```

### Tests Timeout
```bash
# Increase timeout in test settings
TEST_RUNNER = 'django.test.runner.DiscoverRunner'
TEST_TIMEOUT = 300  # 5 minutes
```

### Import Errors
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

**Note:** All tests output clean text without color codes for better readability in logs and CI/CD pipelines.
