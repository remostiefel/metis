import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { Module } from '@/types';

const contentDirectory = path.join(process.cwd(), 'content');

export async function getModuleData(filePath: string): Promise<Module> {
    const fullPath = path.join(contentDirectory, filePath);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    // Use remark to convert markdown into HTML string
    const processedContent = await remark()
        .use(html)
        .process(matterResult.content);
    const contentHtml = processedContent.toString();

    return {
        slug: filePath.replace(/\.md$/, ''),
        filePath: filePath,
        content: matterResult.content,
        htmlContent: contentHtml,
        ...(matterResult.data as any),
    };
}

export function getAllModules(): Module[] {
    // Check if content directory exists
    if (!fs.existsSync(contentDirectory)) {
        console.warn('Content directory does not exist:', contentDirectory);
        return [];
    }

    // Recursively get all markdown files
    const files = getFilesRecursively(contentDirectory);

    const modules = files
        .filter(file => !file.endsWith('template.md')) // Exclude template
        .map((file) => {
            const relativePath = path.relative(contentDirectory, file);
            const fileContents = fs.readFileSync(file, 'utf8');
            const matterResult = matter(fileContents);

            return {
                slug: relativePath.replace(/\.md$/, ''),
                filePath: relativePath,
                content: matterResult.content,
                ...(matterResult.data as any),
            };
        });

    // Sort modules by chapter and subchapter
    return modules.sort((a, b) => {
        const valA = String(a.kapitel || '');
        const valB = String(b.kapitel || '');

        if (valA !== valB) {
            return valA.localeCompare(valB, undefined, { numeric: true });
        }

        const subA = String(a.unterkapitel || '');
        const subB = String(b.unterkapitel || '');

        return subA.localeCompare(subB, undefined, { numeric: true });
    });
}

function getFilesRecursively(dir: string): string[] {
    let results: string[] = [];

    try {
        const list = fs.readdirSync(dir);

        list.forEach((file) => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat && stat.isDirectory()) {
                /* Recurse into a subdirectory */
                results = results.concat(getFilesRecursively(filePath));
            } else {
                /* Is a file */
                if (file.endsWith('.md')) {
                    results.push(filePath);
                }
            }
        });
    } catch (error) {
        console.error('Error reading directory:', dir, error);
    }

    return results;
}
