export interface InterviewQuestion {
  id: string;
  category: 'Technical Core' | 'System & Domain Architecture' | 'Behavioral & Leadership' | 'JD Specific';
  question: string;
  difficulty: 'Medium' | 'Hard';
  keyPointsToCover: string[];
}

export class AIInterviewService {
  public static generateQuestions(targetRole: string = 'sde', resumeText: string = '', jdText: string = ''): InterviewQuestion[] {
    const questions: InterviewQuestion[] = [];

    if (targetRole === 'sde' || targetRole === 'software') {
      questions.push(
        {
          id: 'q-sde-1',
          category: 'System & Domain Architecture',
          question: 'How would you architect a high-throughput microservices application handling 2M+ daily requests with zero downtime?',
          difficulty: 'Hard',
          keyPointsToCover: [
            'Load balancing & API gateway setup',
            'Database indexing & Redis caching strategies',
            'Asynchronous task queues (RabbitMQ/BullMQ)',
            'Graceful degradation & circuit breaker pattern'
          ]
        },
        {
          id: 'q-sde-2',
          category: 'Technical Core',
          question: 'Explain how you optimize PostgreSQL queries when dealing with large-scale tables, and when you choose Redis caching.',
          difficulty: 'Medium',
          keyPointsToCover: [
            'EXPLAIN ANALYZE for query plans',
            'B-Tree composite indexes',
            'Cache eviction strategies (LRU, TTL)',
            'Cache stampede prevention'
          ]
        },
        {
          id: 'q-sde-3',
          category: 'JD Specific',
          question: 'What trade-offs do you consider when deciding between RESTful APIs vs GraphQL endpoints for client-server communication?',
          difficulty: 'Medium',
          keyPointsToCover: [
            'Over-fetching and under-fetching data',
            'N+1 query problem in GraphQL resolvers',
            'Caching mechanisms at network level',
            'Schema evolution & API versioning'
          ]
        },
        {
          id: 'q-sde-4',
          category: 'Behavioral & Leadership',
          question: 'Describe a situation where a production service failed under heavy load. How did you triage, resolve, and prevent recurrence?',
          difficulty: 'Medium',
          keyPointsToCover: [
            'STAR method (Situation, Task, Action, Result)',
            'Root cause analysis (RCA) and post-mortem',
            'Telemetry metrics and alerting setup',
            'Refactoring to prevent future bottlenecks'
          ]
        }
      );
    } else if (targetRole === 'data-science') {
      questions.push(
        {
          id: 'q-ds-1',
          category: 'Technical Core',
          question: 'How do you address class imbalance in binary classification when predicting rare events like customer churn?',
          difficulty: 'Medium',
          keyPointsToCover: ['SMOTE / Oversampling', 'F1-score vs ROC-AUC', 'Cost-sensitive learning', 'Threshold tuning']
        },
        {
          id: 'q-ds-2',
          category: 'System & Domain Architecture',
          question: 'Describe how you package and deploy a trained PyTorch/TensorFlow NLP model as a Dockerized service with low latency.',
          difficulty: 'Hard',
          keyPointsToCover: ['ONNX runtime optimization', 'FastAPI async workers', 'Model quantization', 'GPU vs CPU inference']
        }
      );
    } else {
      questions.push(
        {
          id: 'q-gen-1',
          category: 'Behavioral & Leadership',
          question: 'Walk me through a key project on your resume. What was your individual contribution and how did you measure success?',
          difficulty: 'Medium',
          keyPointsToCover: ['Clear problem statement', 'Specific technical ownership', 'Quantifiable metrics achieved', 'Learnings']
        }
      );
    }

    return questions;
  }
}
