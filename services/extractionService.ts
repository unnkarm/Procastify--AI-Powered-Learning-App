import { Attachment } from '../types';
import { YoutubeTranscript } from 'youtube-transcript';
import * as cheerio from 'cheerio';


export interface ExtractionResult {
  text: string;
  success: boolean;
  error?: string;
}


export const extractYouTubeTranscript = async (url: string): Promise<ExtractionResult> => {
  try {
   
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = new URL(url).searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }

    if (!videoId) {
      return { 
        text: '', 
        success: false, 
        error: 'Invalid YouTube URL format' 
      };
    }

    
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return { 
        text: '', 
        success: false, 
        error: 'No transcript available. Video may not have captions.' 
      };
    }

    
    const text = transcript.map((entry: any) => entry.text).join(' ').trim();
    
    if (!text || text.length === 0) {
      return { 
        text: '', 
        success: false, 
        error: 'Transcript content was empty' 
      };
    }

    
    const limitedText = text.substring(0, 20000);
    
    return { 
      text: limitedText, 
      success: true 
    };
  } catch (error) {
    console.error('YouTube transcript extraction failed:', error);
    return { 
      text: '', 
      success: false, 
      error: `Failed to extract transcript: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};


export const extractWebsiteContent = async (url: string): Promise<ExtractionResult> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { 
        text: '', 
        success: false, 
        error: `Website returned status ${response.status}` 
      };
    }

    const html = await response.text();
    
    if (!html || html.length === 0) {
      return { 
        text: '', 
        success: false, 
        error: 'Website returned empty content' 
      };
    }
    
   
    const $ = cheerio.load(html);
    
    
    $('script, style, noscript, meta, link').remove();
    $('nav, footer, [role="navigation"], .navbar, .header, .sidebar').remove();
    $('.ads, .advertisement, .ad, [class*="ad-"], [id*="ad-"]').remove();
    $('[class*="cookie"], [class*="popup"], [class*="modal"]').remove();
    
    
    let content = '';
    
    if ($('article').length) {
      content = $('article').text();
    } else if ($('main').length) {
      content = $('main').text();
    } else if ($('[role="main"]').length) {
      content = $('[role="main"]').text();
    } else if ($('body').length) {
      
      const $body = $('body').clone();
      $body.find('.sidebar, aside, [class*="related"]').remove();
      content = $body.text();
    }
    
    
    content = content
      .replace(/\s+/g, ' ')
      .trim();
    
    
    if (content.length < 100) {
      return { 
        text: '', 
        success: false, 
        error: 'Could not extract meaningful content from website' 
      };
    }
    
    
    const limitedContent = content.substring(0, 15000);
    
    return { 
      text: limitedContent, 
      success: true 
    };
  } catch (error) {
    console.error('Website extraction failed:', error);
    
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return { 
        text: '', 
        success: false, 
        error: 'Could not fetch website (CORS blocked or network error). Try pasting content directly.' 
      };
    }
    
    return { 
      text: '', 
      success: false, 
      error: `Error extracting website: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};


export const extractTextFromAttachments = async (attachments: Attachment[]): Promise<{
  texts: string[];
  errors: string[];
}> => {
  const texts: string[] = [];
  const errors: string[] = [];

  for (const att of attachments) {
    try {
      let result: ExtractionResult;

      if (att.type === 'url') {
        
        if (att.content.includes('youtube.com') || att.content.includes('youtu.be')) {
          result = await extractYouTubeTranscript(att.content);
        } else {
          
          result = await extractWebsiteContent(att.content);
        }
        
        if (result.success && result.text) {
          texts.push(result.text);
        } else if (result.error) {
          errors.push(`${att.type}: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${att.type}:`, error);
      errors.push(`Failed to process ${att.type}: ${att.name}`);
    }
  }

  return { texts, errors };
};


export const prepareTextForSummarization = async (
  userText: string,
  attachments: Attachment[]
): Promise<{ combinedText: string; failedExtractions: string[] } | null> => {
  const textParts = [];
  
  
  if (userText && userText.trim()) {
    textParts.push(userText.trim());
  }
  
  
  const { texts: extractedTexts, errors } = await extractTextFromAttachments(attachments);
  textParts.push(...extractedTexts);
  
  
  const combinedText = textParts.join('\n\n---\n\n').trim();
  
  if (!combinedText || combinedText.length === 0) {
    return null; 
  }
  
  
  const finalText = combinedText.substring(0, 30000);
  
  return {
    combinedText: finalText,
    failedExtractions: errors
  };
};
