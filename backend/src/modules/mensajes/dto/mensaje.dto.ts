import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsBoolean } from 'class-validator';

export class CreateMensajeDto {
  @IsMongoId()
  @IsNotEmpty({ message: 'El receptor es requerido' })
  receptor: string;

  @IsString()
  @IsNotEmpty({ message: 'El contenido es requerido' })
  contenido: string;

  @IsMongoId()
  @IsOptional()
  tutoria?: string;
}

export class FiltrosMensajeDto {
  @IsMongoId()
  @IsOptional()
  emisor?: string;

  @IsMongoId()
  @IsOptional()
  receptor?: string;

  @IsMongoId()
  @IsOptional()
  tutoria?: string;

  @IsBoolean()
  @IsOptional()
  leido?: boolean;
}
