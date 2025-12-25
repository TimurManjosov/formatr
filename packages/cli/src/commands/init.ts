/**
 * Init command - Initialize a new formatr project
 */
import { Command } from 'commander';
import { 
  logger, 
  writeFile,
  pathExists,
  EXIT_CODES,
} from '../utils/index.js';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

interface InitOptions {
  template?: 'basic' | 'typescript' | 'advanced' | 'documentation';
  installDeps?: boolean;
  configOnly?: boolean;
}

/**
 * Project templates
 */
const TEMPLATES = {
  basic: {
    description: 'Basic formatr project',
    files: {
      'templates/greeting.fmt': 'Hello {name|upper}!\nWelcome to formatr.',
      'data/sample.json': JSON.stringify({ name: 'World' }, null, 2),
      '.formatrrc.json': JSON.stringify({
        templateExtension: '.fmt',
        outputDir: './dist',
        locale: 'en-US',
      }, null, 2),
      'README.md': `# My Formatr Project

This project uses formatr for template rendering.

## Getting Started

\`\`\`bash
# Render a template
formatr render templates/greeting.fmt --data data/sample.json

# Validate templates
formatr validate templates/

# Watch for changes
formatr watch templates/ --data data/sample.json
\`\`\`

## Project Structure

- \`templates/\` - Template files (.fmt)
- \`data/\` - Sample data files
- \`.formatrrc.json\` - Formatr configuration
`,
    },
  },
  typescript: {
    description: 'TypeScript project with types',
    files: {
      'templates/user.fmt': 'User Profile\n============\nName: {name|upper}\nEmail: {email|lower}\nAge: {age|number}',
      'data/user.json': JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      }, null, 2),
      'src/index.ts': `import { template } from '@timur_manjosov/formatr';

interface User {
  name: string;
  email: string;
  age: number;
}

const userTemplate = template<User>(
  'Hello {name|upper}! Your email is {email|lower}.'
);

const user: User = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
};

console.log(userTemplate(user));
`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'node',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          outDir: './dist',
        },
        include: ['src'],
      }, null, 2),
      'package.json': JSON.stringify({
        name: 'my-formatr-project',
        version: '1.0.0',
        type: 'module',
        scripts: {
          build: 'tsc',
          start: 'node dist/index.js',
          'render': 'formatr render templates/user.fmt --data data/user.json',
        },
        dependencies: {
          '@timur_manjosov/formatr': '^0.5.0',
        },
        devDependencies: {
          '@formatr/cli': '^1.0.0',
          typescript: '^5.0.0',
        },
      }, null, 2),
      '.formatrrc.json': JSON.stringify({
        templateExtension: '.fmt',
        outputDir: './dist',
        locale: 'en-US',
      }, null, 2),
      'README.md': `# My Formatr TypeScript Project

A TypeScript project using formatr for type-safe template rendering.

## Setup

\`\`\`bash
npm install
npm run build
npm start
\`\`\`

## CLI Commands

\`\`\`bash
npm run render
\`\`\`
`,
    },
  },
  advanced: {
    description: 'Advanced project with examples',
    files: {
      'templates/email.fmt': `Subject: Welcome to {company|upper}!

Dear {user.name|capitalize},

Thank you for joining {company}. Your account has been created with the email: {user.email|lower}.

Your subscription: {subscription|upper}
Amount: {amount|currency:USD}

Best regards,
The {company} Team`,
      'templates/report.fmt': `# {title|upper}

Generated: {date|date:medium}

## Summary
{summary}

## Details
{details}

---
Report ID: {id}`,
      'data/email.json': JSON.stringify({
        company: 'Acme Inc',
        user: { name: 'jane doe', email: 'JANE@ACME.COM' },
        subscription: 'premium',
        amount: 99.99,
      }, null, 2),
      'data/report.json': JSON.stringify({
        title: 'Monthly Report',
        date: new Date().toISOString(),
        summary: 'This is the monthly summary.',
        details: 'Detailed information goes here.',
        id: 'RPT-001',
      }, null, 2),
      '.formatrrc.json': JSON.stringify({
        templateExtension: '.fmt',
        outputDir: './dist',
        locale: 'en-US',
        lint: {
          extends: 'recommended',
          rules: {
            'no-empty-placeholders': 'error',
          },
        },
      }, null, 2),
      'README.md': `# Advanced Formatr Project

A comprehensive formatr project with multiple templates and configurations.

## Templates

- \`email.fmt\` - Email template with user data
- \`report.fmt\` - Report template with formatting

## Commands

\`\`\`bash
# Render email
formatr render templates/email.fmt --data data/email.json

# Render report
formatr render templates/report.fmt --data data/report.json

# Validate all templates
formatr validate templates/ --recursive

# Analyze templates
formatr analyze templates/ --detailed

# Benchmark
formatr benchmark templates/email.fmt --data data/email.json --iterations 10000
\`\`\`
`,
    },
  },
  documentation: {
    description: 'Documentation project',
    files: {
      'templates/api-doc.fmt': `# {title}

{description}

## Endpoint

\`{method|upper}\` \`{endpoint}\`

## Parameters

{parameters}

## Response

\`\`\`json
{response}
\`\`\`
`,
      'data/api-doc.json': JSON.stringify({
        title: 'Get User',
        description: 'Retrieves user information by ID.',
        method: 'get',
        endpoint: '/api/users/:id',
        parameters: '- `id` (required): User ID',
        response: '{\n  "id": "123",\n  "name": "John Doe"\n}',
      }, null, 2),
      '.formatrrc.json': JSON.stringify({
        templateExtension: '.fmt',
        outputDir: './docs',
        format: { style: 'expanded' },
      }, null, 2),
      'README.md': `# Documentation Project

Generate documentation from templates.

## Usage

\`\`\`bash
# Generate documentation
formatr report --template templates/api-doc.fmt --data data/api-doc.json --format markdown

# Generate HTML docs
formatr report --template templates/api-doc.fmt --data data/api-doc.json --format html --output-dir ./docs
\`\`\`
`,
    },
  },
};

/**
 * Create project files
 */
async function createProject(
  projectName: string,
  templateName: keyof typeof TEMPLATES
): Promise<void> {
  const template = TEMPLATES[templateName];
  const projectDir = projectName === '.' ? process.cwd() : join(process.cwd(), projectName);
  
  // Create project directory
  if (projectName !== '.' && !pathExists(projectDir)) {
    await mkdir(projectDir, { recursive: true });
  }
  
  // Create files
  for (const [filePath, content] of Object.entries(template.files)) {
    const fullPath = join(projectDir, filePath);
    await writeFile(fullPath, content);
    logger.success(`Created ${filePath}`);
  }
}

/**
 * Interactive mode (lazy load inquirer)
 */
async function interactiveInit(): Promise<{ projectName: string; template: keyof typeof TEMPLATES }> {
  let inquirer;
  try {
    inquirer = await import('inquirer');
  } catch {
    logger.error('Interactive mode requires the "inquirer" package. Install it with: npm install inquirer');
    process.exit(EXIT_CODES.FAILURE);
  }
  
  const answers = await inquirer.default.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: 'my-formatr-project',
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: Object.entries(TEMPLATES).map(([key, value]) => ({
        name: `${key} - ${value.description}`,
        value: key,
      })),
    },
  ]);
  
  return answers as { projectName: string; template: keyof typeof TEMPLATES };
}

export const initCommand = new Command('init')
  .description('Initialize a new formatr project')
  .argument('[project-name]', 'Project name (use "." for current directory)')
  .option('-t, --template <type>', 'Project template: basic, typescript, advanced, documentation')
  .option('--install-deps', 'Install dependencies after initialization')
  .option('--config-only', 'Create configuration file only')
  .action(async (projectName: string | undefined, options: InitOptions) => {
    try {
      // Config only mode
      if (options.configOnly) {
        const configPath = '.formatrrc.json';
        if (pathExists(configPath)) {
          logger.warn(`Configuration file already exists: ${configPath}`);
          process.exit(EXIT_CODES.SUCCESS);
          return;
        }
        
        const config = {
          templateExtension: '.fmt',
          outputDir: './dist',
          locale: 'en-US',
          lint: {
            extends: 'recommended',
          },
        };
        
        await writeFile(configPath, JSON.stringify(config, null, 2));
        logger.success(`Created ${configPath}`);
        process.exit(EXIT_CODES.SUCCESS);
        return;
      }
      
      let finalProjectName: string;
      let templateName: keyof typeof TEMPLATES;
      
      // Interactive mode if no project name provided
      if (!projectName) {
        const answers = await interactiveInit();
        finalProjectName = answers.projectName;
        templateName = answers.template;
      } else {
        finalProjectName = projectName;
        templateName = (options.template as keyof typeof TEMPLATES) ?? 'basic';
      }
      
      // Validate template
      if (!TEMPLATES[templateName]) {
        logger.error(`Unknown template: ${templateName}`);
        logger.info('Available templates: ' + Object.keys(TEMPLATES).join(', '));
        process.exit(EXIT_CODES.INVALID_USAGE);
        return;
      }
      
      // Check if directory exists and is not empty
      if (finalProjectName !== '.' && pathExists(finalProjectName)) {
        logger.error(`Directory already exists: ${finalProjectName}`);
        process.exit(EXIT_CODES.FAILURE);
        return;
      }
      
      logger.info(`Creating ${templateName} project: ${finalProjectName}`);
      console.log();
      
      await createProject(finalProjectName, templateName);
      
      console.log();
      logger.success('Project created successfully!');
      console.log();
      logger.info('Next steps:');
      
      if (finalProjectName !== '.') {
        console.log(`  cd ${finalProjectName}`);
      }
      
      if (options.installDeps || templateName === 'typescript') {
        console.log('  npm install');
      }
      
      console.log('  formatr --help');
      
      process.exit(EXIT_CODES.SUCCESS);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(EXIT_CODES.FAILURE);
    }
  });

export default initCommand;
