import { AtsScoringEngine } from './scoringEngine';

export interface BenchmarkTestCase {
  id: string;
  name: string;
  category: 'Software Engineering' | 'Data Science' | 'Product Management' | 'Marketing' | 'Adversarial';
  jdText: string;
  resumeText: string;
  expectedScoreRange: [number, number];
  expectedMatchedRequiredSkills: string[];
  expectedMissingRequiredSkills: string[];
  mustNotMatchSkills?: [string, string][];
}

export const BENCHMARK_DATASET: BenchmarkTestCase[] = [
  // Required Final Test Case 1: Candidate A (Strong Technical Match, Minor Experience Gap)
  {
    id: 'tc-req-53-a',
    name: 'Data Analyst - Strong Technical Candidate (Candidate A)',
    category: 'Data Science',
    jdText: `Data Analyst
Required Skills:
SQL
Python
Power BI
Excel
2+ years experience
data visualization
stakeholder communication`,
    resumeText: `Candidate A
Email: candidate.a@example.com

SUMMARY
Data Analyst with 3 years experience conducting data analysis, building BI dashboards, and executing complex SQL queries.

SKILLS
SQL, Python, Excel, Power BI, Data Analysis, Data Visualization

EXPERIENCE
Data Analyst | Tech Corp (2022 - Present)
- Executed complex SQL queries and Python data pipelines to analyze customer trends.
- Built Power BI dashboards for sales reporting that improved decision making.
- Developed Excel macro models for financial forecasting.`,
    expectedScoreRange: [78, 89],
    expectedMatchedRequiredSkills: ['sql', 'python', 'power bi', 'excel'],
    expectedMissingRequiredSkills: ['stakeholder communication']
  },

  // Required Final Test Case 2: Candidate B (Correct Skills, Experience Duration Mismatch)
  {
    id: 'tc-req-53-b',
    name: 'Data Analyst - Experience Duration Mismatch (Candidate B)',
    category: 'Data Science',
    jdText: `Senior Data Analyst
Required Skills:
SQL
Python
Power BI
Excel
5+ years experience`,
    resumeText: `Candidate B
Email: candidate.b@example.com

SKILLS
SQL, Python, Power BI, Excel

EXPERIENCE
Data Analyst Intern (6 months)
- Assisted with Python scripts and SQL queries for 6 months.`,
    expectedScoreRange: [45, 68],
    expectedMatchedRequiredSkills: ['sql', 'python', 'power bi', 'excel'],
    expectedMissingRequiredSkills: []
  },

  // Required Final Test Case 3: Candidate C (Keyword Stuffing with Irrelevant Experience)
  {
    id: 'tc-req-53-c',
    name: 'Data Analyst - Keyword Stuffing with Irrelevant Experience (Candidate C)',
    category: 'Adversarial',
    jdText: `Data Analyst
Required Skills:
SQL
Python
Power BI
Excel
2+ years experience`,
    resumeText: `Candidate C
Email: candidate.c@example.com

SKILLS
Python, Python, Python, SQL, SQL, Power BI, Excel

EXPERIENCE
Graphic Designer | Creative Studio (2021 - Present)
- Designed posters, flyers, and logos using Photoshop and Illustrator.
- Mentioned Python and SQL in passing.`,
    expectedScoreRange: [30, 60],
    expectedMatchedRequiredSkills: ['python', 'sql', 'power bi', 'excel'],
    expectedMissingRequiredSkills: []
  },

  // Adversarial Test 1: Java vs JavaScript Non-Equivalence
  {
    id: 'tc-adv-java-js',
    name: 'Adversarial - Java vs JavaScript Non-Equivalence',
    category: 'Adversarial',
    jdText: `JavaScript Developer
Required Skills:
JavaScript
React
Node.js`,
    resumeText: `Java Developer
Email: java.dev@example.com

SKILLS
Java, Spring Boot, Hibernate, MySQL

EXPERIENCE
Java Backend Engineer | Enterprise Inc (2020 - Present)
- Built enterprise Java backend services using Spring Boot and Hibernate.`,
    expectedScoreRange: [20, 45],
    expectedMatchedRequiredSkills: [],
    expectedMissingRequiredSkills: ['javascript', 'react', 'node.js'],
    mustNotMatchSkills: [['java', 'javascript']]
  },

  // Adversarial Test 2: React vs React Native Distinction
  {
    id: 'tc-adv-react-native',
    name: 'Adversarial - React vs React Native Distinction',
    category: 'Adversarial',
    jdText: `Web Frontend Developer
Required Skills:
React
TypeScript
CSS`,
    resumeText: `Mobile Developer
Email: mobile.dev@example.com

SKILLS
React Native, iOS, Android, Swift

EXPERIENCE
Mobile Engineer (2022 - Present)
- Developed mobile applications using React Native for iOS and Android.`,
    expectedScoreRange: [40, 65],
    expectedMatchedRequiredSkills: [],
    expectedMissingRequiredSkills: ['react', 'typescript', 'css']
  }
];

export class BenchmarkRunner {
  public static runAll(): {
    passed: boolean;
    totalTests: number;
    passCount: number;
    failCount: number;
    results: any[];
    metrics: { mae: number; rmse: number; precision: number; recall: number };
  } {
    let passCount = 0;
    let totalErrorSum = 0;
    let squaredErrorSum = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    const results: any[] = [];

    BENCHMARK_DATASET.forEach(testCase => {
      const evalResult = AtsScoringEngine.evaluate(testCase.resumeText, testCase.jdText);
      const score = evalResult.overallScore;
      const [minExp, maxExp] = testCase.expectedScoreRange;

      const scorePassed = score >= minExp && score <= maxExp;
      
      const midExp = (minExp + maxExp) / 2;
      const err = Math.abs(score - midExp);
      totalErrorSum += err;
      squaredErrorSum += err * err;

      // Evaluate skill matching precision/recall
      const matchedSkillNorms = evalResult.matchedRequiredSkills.map(s => s.normalizedRequirement);
      
      testCase.expectedMatchedRequiredSkills.forEach(sk => {
        if (matchedSkillNorms.includes(sk)) {
          truePositives++;
        } else {
          falseNegatives++;
        }
      });

      // Check unsafe non-match rules
      if (testCase.mustNotMatchSkills) {
        testCase.mustNotMatchSkills.forEach(([sA, sB]) => {
          const matchA = evalResult.matchedRequiredSkills.find(s => s.requirement.toLowerCase() === sA);
          if (matchA && matchA.matchedAlias?.toLowerCase() === sB) {
            falsePositives++;
          }
        });
      }

      if (scorePassed) passCount++;

      results.push({
        id: testCase.id,
        name: testCase.name,
        expectedScoreRange: testCase.expectedScoreRange,
        actualScore: score,
        scorePassed,
        breakdown: evalResult.breakdown
      });
    });

    const totalTests = BENCHMARK_DATASET.length;
    const mae = Math.round((totalErrorSum / totalTests) * 100) / 100;
    const rmse = Math.round(Math.sqrt(squaredErrorSum / totalTests) * 100) / 100;
    const precision = Math.round((truePositives / Math.max(1, truePositives + falsePositives)) * 100) / 100;
    const recall = Math.round((truePositives / Math.max(1, truePositives + falseNegatives)) * 100) / 100;

    return {
      passed: passCount === totalTests,
      totalTests,
      passCount,
      failCount: totalTests - passCount,
      results,
      metrics: {
        mae,
        rmse,
        precision,
        recall
      }
    };
  }
}
