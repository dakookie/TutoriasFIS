import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsEnum,
  IsString,
} from 'class-validator';
import { EstadoSolicitud } from '../schemas/solicitud.schema';

export class CreateSolicitudDto {
  @IsNotEmpty({ message: 'La tutoría es requerida' })
  @IsMongoId({ message: 'ID de tutoría no válido' })
  tutoria: string;
}

export class UpdateSolicitudDto {
  @IsOptional()
  @IsEnum(EstadoSolicitud, { message: 'Estado no válido' })
  estado?: EstadoSolicitud;

  @IsOptional()
  @IsString()
  motivoRechazo?: string;
}

export class UpdateSolicitudEstadoDto {
  @IsNotEmpty({ message: 'El estado es requerido' })
  @IsEnum(EstadoSolicitud, { message: 'Estado no válido' })
  estado: EstadoSolicitud;
}

export class FiltrosSolicitudDto {
  @IsOptional()
  @IsMongoId()
  estudiante?: string;

  @IsOptional()
  @IsMongoId()
  tutoria?: string;

  @IsOptional()
  @IsEnum(EstadoSolicitud)
  estado?: EstadoSolicitud;
}
