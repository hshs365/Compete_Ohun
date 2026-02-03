import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { join, isAbsolute } from 'path';
import iconv from 'iconv-lite';

/**
 * 대한체육회 스포츠지원포털 선수등록정보 - 공공데이터포털 CSV 사용
 * - 공공데이터포털(data.go.kr)에서 "대한체육회_스포츠지원포털_선수등록정보" CSV 파일 다운로드 후 사용
 * - KSA_ATHLETE_CSV_PATH: 서버 내 CSV 파일 경로 (예: ./data/선수등록정보.csv)
 * - 또는 KSA_ATHLETE_CSV_URL: CSV 다운로드 URL (공공데이터포털 파일 URL 또는 자체 호스팅 URL)
 * 활용신청·API 키 없이 CSV 파일만 있으면 됨
 */
export interface AthleteSearchResult {
  found: boolean;
  data?: {
    sport?: string;
    subSport?: string;
    registeredYear?: number;
    gender?: string;
    [key: string]: unknown;
  };
  message?: string;
}

@Injectable()
export class AthleteService {
  private readonly csvPath: string | undefined;
  private readonly csvUrl: string | undefined;
  private cache: Array<Record<string, string>> | null = null;
  private cacheTime = 0;
  private readonly cacheTtlMs = 60 * 60 * 1000; // 1시간

  constructor(private configService: ConfigService) {
    this.csvPath = this.configService.get<string>('KSA_ATHLETE_CSV_PATH');
    this.csvUrl = this.configService.get<string>('KSA_ATHLETE_CSV_URL');
  }

  isConfigured(): boolean {
    return !!(this.csvPath?.trim() || this.csvUrl?.trim());
  }

  /**
   * CSV 로드 (URL이면 fetch, 경로면 파일 읽기). 캐시 사용
   */
  private async loadCsv(): Promise<Array<Record<string, string>>> {
    const now = Date.now();
    if (this.cache && now - this.cacheTime < this.cacheTtlMs) {
      return this.cache;
    }

    let raw = '';
    if (this.csvUrl?.trim()) {
      const res = await fetch(this.csvUrl.trim());
      if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
      raw = await res.text();
    } else if (this.csvPath?.trim()) {
      const fullPath = isAbsolute(this.csvPath)
        ? this.csvPath
        : join(process.cwd(), this.csvPath);
      const buffer = await readFile(fullPath);
      raw = iconv.decode(buffer, 'euc-kr');
    } else {
      return [];
    }

    const rows = this.parseCsv(raw);
    this.cache = rows;
    this.cacheTime = now;
    return rows;
  }

  /**
   * 간단 CSV 파싱 (쉼표 구분, 첫 줄 헤더). 따옴표 필드 처리
   */
  private parseCsv(text: string): Array<Record<string, string>> {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];
    const header = this.parseCsvLine(lines[0]);
    const rows: Array<Record<string, string>> = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      header.forEach((h, j) => {
        row[h] = values[j] ?? '';
      });
      rows.push(row);
    }
    return rows;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (inQuotes) {
        current += c;
      } else if (c === ',' || c === ';') {
        result.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * 실명(및 생년월일)으로 CSV에서 선수 조회
   * 공공데이터포털 CSV 컬럼명은 한글일 수 있음 (성명, 생년월일, 종목, 세부종목, 등록년도, 성별 등)
   */
  async findByRealName(
    realName: string,
    birthDate?: string | Date | null,
  ): Promise<AthleteSearchResult> {
    if (!this.isConfigured()) {
      return {
        found: false,
        message: '선수 데이터(CSV)가 설정되지 않았습니다. 공공데이터포털에서 CSV를 다운로드해 설정해 주세요.',
      };
    }

    const name = realName?.trim();
    if (!name || name.length < 2) {
      return { found: false, message: '실명을 입력해 주세요.' };
    }

    try {
      const rows = await this.loadCsv();
      if (rows.length === 0) {
        return { found: false, message: '선수 데이터가 비어 있거나 형식을 확인해 주세요.' };
      }

      const normalizedName = name.replace(/\s/g, '');
      const birthStr =
        birthDate instanceof Date
          ? birthDate.toISOString().slice(0, 10).replace(/-/g, '')
          : typeof birthDate === 'string'
            ? birthDate.replace(/-/g, '').slice(0, 8)
            : '';

      const nameKeys = ['성명', '이름', '선수명', 'p_nm', 'name', 'playerName'];
      const birthKeys = ['생년월일', '생일', 'birth_dt', 'birthDt', 'birthDate'];
      const sportKeys = ['종목', 'sport_nm', 'sport', '종목명'];
      const subSportKeys = ['세부종목', 'sub_sport_nm', 'subSport'];
      const yearKeys = ['등록년도', 'reg_yr', 'registeredYear', '등록연도'];
      const genderKeys = ['성별', 'gender'];

      const getVal = (row: Record<string, string>, keys: string[]): string => {
        for (const k of keys) {
          const v = row[k];
          if (v != null && String(v).trim()) return String(v).trim();
        }
        return '';
      };

      for (const row of rows) {
        const rowName = getVal(row, nameKeys).replace(/\s/g, '');
        if (rowName !== normalizedName) continue;
        if (birthStr) {
          const rowBirth = getVal(row, birthKeys).replace(/\D/g, '').slice(0, 8);
          if (rowBirth && rowBirth !== birthStr) continue;
        }
        const sport = getVal(row, sportKeys);
        const subSport = getVal(row, subSportKeys);
        const yearStr = getVal(row, yearKeys);
        const gender = getVal(row, genderKeys);
        return {
          found: true,
          data: {
            sport: sport || undefined,
            subSport: subSport || undefined,
            registeredYear: yearStr ? parseInt(yearStr, 10) : undefined,
            gender: gender || undefined,
          },
        };
      }

      return { found: false, message: '등록된 선수 정보를 찾을 수 없습니다.' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        found: false,
        message: `선수 조회 중 오류가 발생했습니다. (${msg})`,
      };
    }
  }
}
