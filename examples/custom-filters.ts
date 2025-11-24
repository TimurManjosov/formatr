import { template } from '../src';

console.log('=== Custom Filter Examples ===\n');

// Example 1: Simple custom filter
console.log('1. Emoji Decorator Filter:');

const emojiGreet = template<{ name: string }>(
  "Hi {name|emoji:wave}", 
  {
    filters: {
      emoji: (value: unknown, type: string = "wave") => {
        const emojis: Record<string, string> = {
          wave: "👋",
          heart: "❤️",
          star: "⭐",
          fire: "🔥",
          check: "✅",
        };
        return `${emojis[type] || "😊"} ${String(value)}`;
      }
    }
  }
);

console.log(emojiGreet({ name: "Alex" }));

const emojiHeart = template<{ name: string }>(
  "Welcome {name|emoji:heart}", 
  {
    filters: {
      emoji: (value: unknown, type: string = "wave") => {
        const emojis: Record<string, string> = {
          wave: "👋",
          heart: "❤️",
          star: "⭐",
          fire: "🔥",
          check: "✅",
        };
        return `${emojis[type] || "😊"} ${String(value)}`;
      }
    }
  }
);

console.log(emojiHeart({ name: "Sarah" }));

// Example 2: HTML Escape Filter
console.log('\n2. HTML Escape Filter:');

const htmlTemplate = template<{ userInput: string }>(
  "<div>{userInput|escape}</div>",
  {
    filters: {
      escape: (value: unknown) => {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
    }
  }
);

console.log(htmlTemplate({ userInput: '<script>alert("xss")</script>' }));
console.log(htmlTemplate({ userInput: 'Safe text & "quotes"' }));

// Example 3: Markdown Bold Filter
console.log('\n3. Markdown Filter:');

const markdownTemplate = template<{ title: string; emphasis: string }>(
  "# {title|bold}\n\n{emphasis|italic}",
  {
    filters: {
      bold: (value: unknown) => `**${String(value)}**`,
      italic: (value: unknown) => `*${String(value)}*`,
    }
  }
);

console.log(markdownTemplate({ 
  title: "Important Notice", 
  emphasis: "Please read carefully" 
}));

// Example 4: Mask Filter for sensitive data
console.log('\n4. Mask Filter for Sensitive Data:');

const maskedTemplate = template<{ 
  cardNumber: string;
  ssn: string;
  email: string;
}>(
  "Card: {cardNumber|mask:12,4}\nSSN: {ssn|mask:5,4}\nEmail: {email|maskEmail}",
  {
    filters: {
      mask: (value: unknown, hideCount: string, showCount: string = "4") => {
        const str = String(value);
        const hide = parseInt(hideCount, 10);
        const show = parseInt(showCount, 10);
        return '*'.repeat(hide) + str.slice(-show);
      },
      maskEmail: (value: unknown) => {
        const email = String(value);
        const [local, domain] = email.split('@');
        if (!domain) return email;
        return `${local.charAt(0)}***@${domain}`;
      }
    }
  }
);

console.log(maskedTemplate({ 
  cardNumber: "1234567812345678",
  ssn: "123456789",
  email: "user@example.com"
}));

// Example 5: Abbreviate Filter
console.log('\n5. Abbreviate Filter:');

const abbreviateTemplate = template<{ firstName: string; lastName: string }>(
  "Author: {firstName|abbrev}. {lastName}",
  {
    filters: {
      abbrev: (value: unknown) => {
        const str = String(value);
        return str.charAt(0).toUpperCase();
      }
    }
  }
);

console.log(abbreviateTemplate({ firstName: "John", lastName: "Doe" }));
console.log(abbreviateTemplate({ firstName: "Jane", lastName: "Smith" }));

// Example 6: File Size Filter
console.log('\n6. File Size Formatter:');

const fileSizeTemplate = template<{ fileName: string; bytes: number }>(
  "{fileName}: {bytes|filesize}",
  {
    filters: {
      filesize: (value: unknown) => {
        const bytes = Number(value);
        if (isNaN(bytes)) return String(value);
        
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
      }
    }
  }
);

console.log(fileSizeTemplate({ fileName: "document.pdf", bytes: 1024 }));
console.log(fileSizeTemplate({ fileName: "video.mp4", bytes: 104857600 }));
console.log(fileSizeTemplate({ fileName: "image.jpg", bytes: 524288 }));

// Example 7: Duration Filter
console.log('\n7. Duration Formatter:');

const durationTemplate = template<{ task: string; milliseconds: number }>(
  "{task} completed in {milliseconds|duration}",
  {
    filters: {
      duration: (value: unknown) => {
        const ms = Number(value);
        if (isNaN(ms)) return String(value);
        
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
        if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
        return `${(ms / 3600000).toFixed(2)}h`;
      }
    }
  }
);

console.log(durationTemplate({ task: "API call", milliseconds: 245 }));
console.log(durationTemplate({ task: "Database query", milliseconds: 1500 }));
console.log(durationTemplate({ task: "File upload", milliseconds: 125000 }));

// Example 8: Combining Custom and Built-in Filters
console.log('\n8. Chaining Custom and Built-in Filters:');

const chainedTemplate = template<{ username: string }>(
  "Welcome {username|trim|lower|emoji:star}!",
  {
    filters: {
      emoji: (value: unknown, type: string = "wave") => {
        const emojis: Record<string, string> = {
          wave: "👋",
          heart: "❤️",
          star: "⭐",
          fire: "🔥",
        };
        return `${emojis[type] || "😊"} ${String(value)}`;
      }
    }
  }
);

console.log(chainedTemplate({ username: "  JOHN DOE  " }));
