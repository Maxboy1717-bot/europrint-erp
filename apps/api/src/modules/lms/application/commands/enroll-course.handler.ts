import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Result, Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LmsRepository } from '../../infrastructure/repositories/drizzle-lms.repo';
import { Enrollment } from '../../domain/repositories/i-lms.repo';

export class EnrollCourseCommand {
  constructor(
    public readonly employeeId: number,
    public readonly courseId: number,
    public readonly courseName: string,
    public readonly enrolledBy: number,
  ) {}
}

@CommandHandler(EnrollCourseCommand)
export class EnrollCourseHandler implements ICommandHandler<EnrollCourseCommand> {
  private readonly logger = new Logger(EnrollCourseHandler.name);

  constructor(
    private readonly lmsRepo: LmsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(command: EnrollCourseCommand): Promise<Result<Enrollment>> {
    this.logger.debug(`Enrolling employee ${command.employeeId} in course ${command.courseName}`);

    const existing = await this.lmsRepo.findEnrollment(command.employeeId, command.courseId);
    if (existing) {
      return Err('Xodim allaqachon ushbu kursga yozilgan');
    }

    const result = await this.lmsRepo.saveEnrollment({
      id: '',
      course_id: String(command.courseId),
      user_id: String(command.employeeId),
      status: 'enrolled',
      created_at: _time.now(),
    });

    if (!result.ok) {
      return Err(String(result.error));
    }

    this.logger.log(`Employee ${command.employeeId} enrolled in course ${command.courseName}`);

    this.eventEmitter.emit('lms.course.enrolled', {
      employeeId: command.employeeId,
      courseId: command.courseId,
      enrolledAt: _time.now(),
    });

    return Ok(result.data);
  }
}
