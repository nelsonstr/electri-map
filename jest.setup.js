// Jest setup file
// Mock environment variables
process.env.TZ = 'America/New_York'

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gt: jest.fn(() => ({
            order: jest.fn(() => ({
              single: jest.fn(() =>
                Promise.resolve({
                  data: [],
                  error: null,
                }),
              ),
            })),
            gt: jest.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
              }),
            ),
          })),
        })),
      })),
    })),
  })),
}))

// Mock file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}))

jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => jest.fn()),
  })),
  transports: {
    DailyRotateFile: jest.fn().mockImplementation(() => ({
      name: 'test-transport',
    })),
  },
  combine: jest.fn((...transports) => ({
    transport: transports.reduce((acc, t) => ({ ...acc, ...t }), {}),
  })),
  format: {
    json: jest.fn(() => ({ transport: () => {} })),
    timestamp: jest.fn(() => ({ transport: () => {} })),
    combine: jest.fn(),
    colorize: jest.fn(),
    printf: jest.fn(),
  },
}))

jest.mock('winston-daily-rotate-file', () => ({
  DailyRotateFile: jest.fn().mockImplementation(() => ({
    name: 'daily-rotate-file',
  })),
}))
